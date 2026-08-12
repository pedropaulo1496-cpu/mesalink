import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          return null;
        }

        const activityAt = new Date();
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: activityAt, lastActiveAt: activityAt },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      const activityAt = Date.now();
      const previouslyTrackedAt = Number(token.activityTrackedAt || 0);
      if (token.id && activityAt - previouslyTrackedAt >= 6 * 60 * 60 * 1000) {
        await prisma.user.updateMany({
          where: { id: String(token.id) },
          data: { lastActiveAt: new Date(activityAt) },
        });
        token.activityTrackedAt = activityAt;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
