import { authOptions } from "@/lib/auth";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";

export async function requireActiveSubscription() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      ok: false,
      status: 401,
      error: "Não autenticado.",
    };
  }

  const hasAccess = await canAccessApp(session.user.email);

  if (!hasAccess) {
    return {
      ok: false,
      status: 403,
      error: "Trial expirado.",
    };
  }

  return {
    ok: true,
    email: session.user.email,
  };
}