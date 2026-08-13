import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType?: "RESTAURANT" | "PARTNER" | "STAFF";
      partnerId?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    accountType?: "RESTAURANT" | "PARTNER" | "STAFF";
    partnerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accountType?: "RESTAURANT" | "PARTNER" | "STAFF";
    partnerId?: string;
    activityTrackedAt?: number;
  }
}
