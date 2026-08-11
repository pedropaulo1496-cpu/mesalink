import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import RevenueInboxClient from "@/components/revenue-ai/RevenueInboxClient";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export default async function RevenueInboxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) redirect("/login");
  if (!hasGrowthAccess(user.subscription)) redirect(`/billing?restaurantId=${id}`);
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, userId: user.id },
    include: {
      revenueConversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 200,
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 30 },
          customer: { select: { marketingOptIn: true } },
        },
      },
    },
  });
  if (!restaurant) notFound();

  const conversations = restaurant.revenueConversations.map((conversation) => ({
    id: conversation.id,
    opportunityType: conversation.opportunityType,
    channel: conversation.channel,
    status: conversation.status,
    contactName: conversation.contactName,
    contactEmail: conversation.contactEmail,
    contactPhone: conversation.contactPhone,
    lastMessagePreview: conversation.lastMessagePreview,
    aiSummary: conversation.aiSummary,
    nextFollowUpAt: conversation.nextFollowUpAt?.toISOString() || null,
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    estimatedRevenue: Number(conversation.estimatedRevenue || 0),
    recoveredRevenue: Number(conversation.recoveredRevenue || 0),
    marketingOptIn: Boolean(conversation.customer?.marketingOptIn),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      sender: message.sender,
      channel: message.channel,
      content: message.content,
      status: message.status,
      sentAt: message.sentAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
    })),
  }));

  return <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
    <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
      <RestaurantSidebar id={id} restaurantName={restaurant.name} active="revenueAi" />
      <RevenueInboxClient restaurantId={id} restaurantName={restaurant.name} initialCredits={user.subscription?.aiCredits || 0} initialEmails={user.subscription?.emailBalance || 0} initialConversations={conversations} />
    </div>
    <BottomNav id={id} />
  </main>;
}
