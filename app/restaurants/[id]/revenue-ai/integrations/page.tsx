import { getServerSession } from "next-auth";
import { ArrowLeft, Workflow } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import RevenueChannelsClient from "@/components/revenue-ai/RevenueChannelsClient";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { getRevenueChannelStatus } from "@/lib/revenue-twilio";

export default async function RevenueIntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) redirect("/login");
  if (!hasGrowthAccess(user.subscription)) redirect(`/billing?restaurantId=${id}`);
  const restaurant = await prisma.restaurant.findFirst({ where: { id, userId: user.id } });
  if (!restaurant) notFound();

  return <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
    <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
      <RestaurantSidebar id={id} restaurantName={restaurant.name} active="revenueAi" />
      <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="mb-7"><Link href={`/restaurants/${id}/revenue-ai`} className="inline-flex items-center gap-2 text-xs font-bold text-[#806D56]"><ArrowLeft size={14} /> Revenue AI</Link><p className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]"><Workflow size={14} /> Canais</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">Liga conversas reais ao MesaLink.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6258]">Configura uma vez. O MesaLink recebe WhatsApp, encaminha chamadas para o restaurante, reconhece quando ninguém atendeu e cria o follow-up no Revenue AI.</p></header>
        <RevenueChannelsClient
          restaurantId={id}
          restaurantName={restaurant.name}
          webhookBaseUrl={(process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/+$/, "")}
          initial={{
            whatsappEnabled: restaurant.revenueWhatsappEnabled,
            whatsappNumber: restaurant.revenueWhatsappNumber || "",
            contentSid: restaurant.revenueWhatsappContentSid || "",
            whatsappAutoReply: restaurant.revenueWhatsappAutoReply,
            voiceEnabled: restaurant.revenueVoiceEnabled,
            voiceNumber: restaurant.revenueVoiceNumber || "",
            forwardNumber: restaurant.revenueVoiceForwardNumber || restaurant.phone || "",
            missedCallAutoReply: restaurant.revenueMissedCallAutoReply,
            lastError: restaurant.revenueChannelsLastError || "",
          }}
          initialStatus={getRevenueChannelStatus(restaurant)}
          whatsappBalance={user.subscription?.whatsappMessageBalance || 0}
          aiCredits={user.subscription?.aiCredits || 0}
        />
      </section>
    </div>
    <BottomNav id={id} />
  </main>;
}
