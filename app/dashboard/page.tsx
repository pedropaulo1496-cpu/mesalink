import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      subscription: true,
      restaurants: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const restaurant = user.restaurants[0];

  // A conta principal do restaurante tem prioridade. Um utilizador pode também
  // ter um perfil Partners, mas só deve entrar nessa app através de /partners/app.
  if (restaurant) {
    redirect(`/restaurants/${restaurant.id}`);
  }

  redirect("/onboarding");
}
