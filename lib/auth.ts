import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { AuthOptions, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

type MesaLinkAccountType = "RESTAURANT" | "PARTNER" | "STAFF";
type MesaLinkAuthUser = User & {
  accountType: MesaLinkAccountType;
  partnerId?: string;
};

const credentialsFields = {
  email: { label: "Email", type: "email" },
  password: { label: "Password", type: "password" },
};

function normalizedEmail(value?: string) {
  return String(value || "").trim().toLowerCase();
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 90 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  jwt: {
    maxAge: 90 * 24 * 60 * 60,
  },

  providers: [
    Credentials({
      id: "credentials",
      name: "MesaLink Restaurante",
      credentials: credentialsFields,
      async authorize(credentials) {
        const email = normalizedEmail(credentials?.email);
        if (!email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            subscription: { select: { id: true } },
            _count: { select: { restaurants: true } },
          },
        });

        const hasRestaurantAccount = Boolean(user?.subscription || user?._count.restaurants);
        if (!user?.passwordHash || !hasRestaurantAccount) return null;
        if (!(await bcrypt.compare(credentials.password, user.passwordHash))) return null;

        const activityAt = new Date();
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: activityAt, lastActiveAt: activityAt },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          accountType: "RESTAURANT",
        } satisfies MesaLinkAuthUser;
      },
    }),
    Credentials({
      id: "partner-credentials",
      name: "MesaLink Partners",
      credentials: credentialsFields,
      async authorize(credentials) {
        const email = normalizedEmail(credentials?.email);
        if (!email || !credentials?.password) return null;

        const partner = await prisma.referralPartner.findUnique({
          where: { email },
          select: {
            id: true,
            userId: true,
            contactName: true,
            businessName: true,
            email: true,
            passwordHash: true,
            status: true,
          },
        });

        if (!partner?.passwordHash || partner.status === "SUSPENDED") return null;
        if (!(await bcrypt.compare(credentials.password, partner.passwordHash))) return null;

        const activityAt = new Date();
        await prisma.referralPartner.update({
          where: { id: partner.id },
          data: { lastLoginAt: activityAt, lastActiveAt: activityAt },
        });

        return {
          id: partner.userId,
          name: partner.contactName || partner.businessName,
          email: partner.email,
          accountType: "PARTNER",
          partnerId: partner.id,
        } satisfies MesaLinkAuthUser;
      },
    }),
    Credentials({
      id: "staff-credentials",
      name: "MesaLink HQ",
      credentials: credentialsFields,
      async authorize(credentials) {
        const email = normalizedEmail(credentials?.email);
        if (!email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { salesProfile: { select: { active: true } } },
        });
        const hasStaffAccess = Boolean(user?.isAdmin || user?.salesProfile?.active);
        const staffPassword = user?.staffPasswordHash;
        if (!user || !hasStaffAccess || !staffPassword) return null;
        if (!(await bcrypt.compare(credentials.password, staffPassword))) return null;

        const activityAt = new Date();
        await prisma.user.update({
          where: { id: user.id },
          data: { staffLastLoginAt: activityAt, staffLastActiveAt: activityAt },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          accountType: "STAFF",
        } satisfies MesaLinkAuthUser;
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const mesaLinkUser = user as MesaLinkAuthUser;
        token.id = mesaLinkUser.id;
        token.accountType = mesaLinkUser.accountType;
        token.partnerId = mesaLinkUser.partnerId;
      }

      const activityAt = Date.now();
      const previouslyTrackedAt = Number(token.activityTrackedAt || 0);
      if (token.id && token.accountType && activityAt - previouslyTrackedAt >= 6 * 60 * 60 * 1000) {
        if (token.accountType === "PARTNER" && token.partnerId) {
          await prisma.referralPartner.updateMany({
            where: { id: String(token.partnerId) },
            data: { lastActiveAt: new Date(activityAt) },
          });
        } else if (token.accountType === "STAFF") {
          await prisma.user.updateMany({
            where: { id: String(token.id) },
            data: { staffLastActiveAt: new Date(activityAt) },
          });
        } else {
          await prisma.user.updateMany({
            where: { id: String(token.id) },
            data: { lastActiveAt: new Date(activityAt) },
          });
        }
        token.activityTrackedAt = activityAt;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType;
        session.user.partnerId = token.partnerId;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
