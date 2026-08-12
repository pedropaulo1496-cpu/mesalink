import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
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
  const activationRequest = await prisma.marketingAction.findFirst({ where: { restaurantId: id, type: "CHANNEL_ACTIVATION_REQUEST" }, orderBy: { createdAt: "desc" }, select: { sentAt: true, channel: true, status: true } });

  return <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
    <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
      <RestaurantSidebar id={id} restaurantName={restaurant.name} active="revenueAi" />
      <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
        <header><Link href={`/restaurants/${id}/revenue-ai`} className="inline-flex items-center gap-2 text-xs font-bold text-[#806D56]"><ArrowLeft size={14} /> Revenue AI</Link><h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">Canais do Revenue AI</h1><p className="mt-2 max-w-3xl text-sm leading-5 text-[#6B6258]">O telefone público continua igual. Quando não atende, o MesaLink contacta o cliente pelo WhatsApp atribuído ao restaurante.</p></header>
        <div className="mt-5">
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
          websiteEnabled={restaurant.websiteEnabled}
          initialRequest={activationRequest ? { requestedAt: activationRequest.sentAt.toISOString(), channels: activationRequest.channel, status: activationRequest.status } : null}
          whatsappBalance={user.subscription?.whatsappMessageBalance || 0}
          aiCredits={user.subscription?.aiCredits || 0}
        />
        </div>
      </section>
    </div>
    <BottomNav id={id} />
  </main>;
}
