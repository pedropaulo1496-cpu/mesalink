import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import RestaurantSupportChat from "@/components/support/RestaurantSupportChat";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SupportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.accountType !== "RESTAURANT") redirect("/login");
  const restaurant = await prisma.restaurant.findFirst({ where: { id, user: { email: session.user.email } }, select: { id: true, name: true } });
  if (!restaurant) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-[#F8F2E8] text-[#17130F] lg:pl-[286px]">
      <RestaurantSidebar id={id} restaurantName={restaurant.name} active="support" />
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-7 lg:pb-10 lg:pt-9">
        <div className="mx-auto mb-6 w-full max-w-4xl"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#A97936]">Apoio ao cliente</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Como podemos ajudar?</h1><p className="mt-2 text-sm text-[#776B5E]">Fala diretamente com a equipa MesaLink sem sair da aplicação.</p></div>
        <RestaurantSupportChat restaurantId={id} />
      </main>
      <BottomNav id={id} />
    </div>
  );
}
