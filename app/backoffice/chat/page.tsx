import Link from "next/link";
import { ArrowLeft, Building2, Headphones, MessageCircleMore, Send, UserRound, UsersRound } from "lucide-react";
import { DoneNotice, dateTime } from "@/components/backoffice/BackofficeUI";
import { prisma } from "@/lib/prisma";
import { requireStaff, type StaffIdentity } from "@/lib/staff-auth";
import { sendCommercialMessage, sendPartnerSupportReply, sendSupportReply } from "../actions";

export const dynamic = "force-dynamic";

export default async function CommercialChatPage({
  searchParams,
}: {
  searchParams: Promise<{ rep?: string; client?: string; partner?: string; mode?: string; done?: string }>;
}) {
  const staff = await requireStaff();
  const { rep: requestedRepresentativeId, client, partner, mode, done } = await searchParams;
  if (mode === "partners" && staff.role === "ADMIN") return renderPartnerSupportInbox(partner, done);
  if (mode !== "team") return renderSupportInbox(staff, client, done);
  const representatives = staff.role === "ADMIN"
    ? await prisma.salesRepresentative.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              clients: true,
              messages: { where: { readAt: null, senderUserId: { not: staff.userId } } },
            },
          },
        },
        orderBy: { name: "asc" },
      })
    : await prisma.salesRepresentative.findMany({
        where: { id: staff.salesRepresentativeId!, active: true },
        select: { id: true, name: true, email: true, _count: { select: { clients: true, messages: true } } },
      });

  const selected = staff.role === "SALES"
    ? representatives[0]
    : representatives.find((item) => item.id === requestedRepresentativeId) || representatives[0];

  const messages = selected
    ? await prisma.commercialMessage.findMany({
        where: { salesRepresentativeId: selected.id },
        include: { senderUser: { select: { id: true, name: true, email: true, isAdmin: true } } },
        orderBy: { createdAt: "asc" },
        take: 300,
      })
    : [];

  if (selected) {
    await prisma.commercialMessage.updateMany({
      where: {
        salesRepresentativeId: selected.id,
        senderUserId: { not: staff.userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  return (
    <>
      <DoneNotice done={done} />
      <ChatWorkspaceHeading
        eyebrow="Contacto interno"
        title="Chat da equipa"
        description={staff.role === "ADMIN" ? "Fala diretamente com cada comercial, acompanha pedidos e desbloqueia negócios sem misturar conversas." : "Canal direto com a administração para clientes, propostas, descontos e ajuda comercial."}
        total={representatives.length}
        totalLabel="conversas"
        alert={representatives.reduce((sum, item) => sum + item._count.messages, 0)}
      />
      <ChatTabs mode="team" role={staff.role} />

      {!selected ? (
        <section className="mt-5 rounded-2xl border border-[#DCC9AA] bg-white p-7 text-center">
          <MessageCircleMore className="mx-auto text-[#A97936]" size={34} />
          <h2 className="mt-3 text-2xl font-semibold">Ainda não há comerciais ativos</h2>
          <p className="mt-2 text-sm text-[#6B6258]">Cria o primeiro comercial na área Equipa para abrir uma conversa.</p>
          {staff.role === "ADMIN" && <Link href="/backoffice/team" className="mt-5 inline-flex rounded-xl bg-[#17130F] px-5 py-3 text-sm font-bold text-white">Criar comercial</Link>}
        </section>
      ) : (
        <section className="mt-5 grid min-h-[540px] overflow-hidden rounded-2xl border border-[#DCC9AA] bg-white lg:grid-cols-[260px_1fr]">
          {staff.role === "ADMIN" && (
            <aside className="border-b border-[#E2D3BC] bg-[#FFF9F0] p-3 lg:border-b-0 lg:border-r">
              <p className="px-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Conversas</p>
              <div className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
                {representatives.map((item) => {
                  const active = item.id === selected.id;
                  return (
                    <Link key={item.id} href={`/backoffice/chat?mode=team&rep=${item.id}`} className={`min-w-[220px] rounded-2xl p-3 lg:block lg:min-w-0 ${active ? "bg-[#17130F] text-white" : "hover:bg-[#F3E8D7]"}`}>
                      <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{item.name}</p>{item._count.messages > 0 && !active && <span className="rounded-full bg-[#D7B267] px-2 py-0.5 text-[9px] font-black text-[#17130F]">{item._count.messages}</span>}</div>
                      <p className={`mt-1 truncate text-[10px] ${active ? "text-white/45" : "text-[#776B5E]"}`}>{item._count.clients} clientes · {item.email}</p>
                    </Link>
                  );
                })}
              </div>
            </aside>
          )}

          <div className="flex min-h-[500px] flex-col">
            <header className="border-b border-[#E2D3BC] px-4 py-3">
              <p className="font-bold">{selected.name}</p>
              <p className="mt-0.5 text-xs text-[#776B5E]">{selected.email} · {selected._count.clients} clientes</p>
            </header>
            <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#FFFCF7] p-4">
              {!messages.length && <div className="mx-auto mt-20 max-w-sm text-center text-sm leading-6 text-[#776B5E]">Ainda não há mensagens. Usa este espaço para pedidos, acompanhamento de clientes e apoio comercial.</div>}
              {messages.map((message) => {
                const own = message.senderUserId === staff.userId;
                return (
                  <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-[20px] px-4 py-3 sm:max-w-[70%] ${own ? "rounded-br-md bg-[#17130F] text-white" : "rounded-bl-md border border-[#E2D3BC] bg-white"}`}>
                      <p className={`mb-1 text-[9px] font-black uppercase tracking-wider ${own ? "text-[#D7B267]" : "text-[#9B6F3B]"}`}>{message.senderUser.name || (message.senderUser.isAdmin ? "Administração" : message.senderUser.email)}</p>
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                      <p className={`mt-2 text-[9px] ${own ? "text-white/40" : "text-[#8A7C6D]"}`}>{dateTime(message.createdAt)}{own && message.readAt ? " · Lida" : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form action={sendCommercialMessage} className="flex gap-2 border-t border-[#E2D3BC] bg-white p-3 sm:p-4">
              <input type="hidden" name="salesRepresentativeId" value={selected.id} />
              <textarea name="body" required maxLength={2000} rows={2} placeholder="Escrever mensagem…" className="min-h-12 flex-1 resize-none rounded-2xl border border-[#DCC9AA] bg-[#FFFCF7] px-4 py-3 text-sm outline-none focus:border-[#9B6F3B]" />
              <button aria-label="Enviar mensagem" className="flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-2xl bg-[#17130F] text-white"><Send size={18} /></button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}

function ChatWorkspaceHeading({ eyebrow, title, description, total, totalLabel, alert = 0 }: { eyebrow: string; title: string; description: string; total: number; totalLabel: string; alert?: number }) {
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-[#17130F] px-5 py-5 text-white shadow-[0_18px_50px_rgba(23,19,15,0.16)] sm:px-6">
      <div className="absolute -right-14 -top-20 h-48 w-48 rounded-full bg-[#D7B267]/15 blur-3xl" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[#D7B267]"><Headphones size={15} /><p className="text-[9px] font-black uppercase tracking-[0.24em]">{eyebrow}</p></div>
          <h1 className="mt-2 text-[1.8rem] font-semibold leading-none tracking-[-0.055em] sm:text-[2.2rem]">{title}</h1>
          <p className="mt-2 max-w-2xl text-[12px] leading-5 text-white/55">{description}</p>
        </div>
        <div className="flex gap-2">
          <div className="min-w-[92px] rounded-[17px] border border-white/10 bg-white/[0.06] px-3 py-2.5"><p className="text-xl font-semibold">{total}</p><p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-white/40">{totalLabel}</p></div>
          <div className={`min-w-[92px] rounded-[17px] border px-3 py-2.5 ${alert ? "border-[#D7B267]/30 bg-[#D7B267]/12" : "border-white/10 bg-white/[0.06]"}`}><p className={alert ? "text-xl font-semibold text-[#E9C987]" : "text-xl font-semibold"}>{alert}</p><p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.13em] text-white/40">por ler</p></div>
        </div>
      </div>
    </section>
  );
}

function ChatTabs({ mode, role }: { mode: "clients" | "partners" | "team"; role: "ADMIN" | "SALES" }) {
  const links = [
    { mode: "clients" as const, href: "/backoffice/chat?mode=clients", label: "Clientes", icon: UserRound },
    ...(role === "ADMIN" ? [{ mode: "partners" as const, href: "/backoffice/chat?mode=partners", label: "Parceiros", icon: Building2 }] : []),
    { mode: "team" as const, href: "/backoffice/chat?mode=team", label: "Equipa", icon: UsersRound },
  ];
  return (
    <nav className={`my-4 grid w-full gap-1 rounded-[18px] border border-[#DCC9AA] bg-white p-1 shadow-[0_8px_26px_rgba(80,55,30,0.04)] ${links.length === 3 ? "grid-cols-3" : "grid-cols-2"}`} aria-label="Caixas de chat">
      {links.map(({ mode: tabMode, href, label, icon: Icon }) => (
        <Link key={tabMode} href={href} className={`flex min-w-0 items-center justify-center gap-2 rounded-[14px] px-2 py-2.5 text-xs font-black transition sm:text-sm ${mode === tabMode ? "bg-[#17130F] text-white shadow-[0_8px_20px_rgba(23,19,15,0.14)]" : "text-[#776B5E] hover:bg-[#F5ECDE]"}`}>
          <Icon size={15} /><span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

async function renderSupportInbox(staff: StaffIdentity, requestedConversationId?: string, done?: string) {
  const conversations = await prisma.supportConversation.findMany({
    where: { partnerId: null, clientUserId: { not: null }, ...(staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {}) },
    include: {
      clientUser: { select: { name: true, email: true, restaurants: { select: { name: true }, take: 1, orderBy: { createdAt: "desc" } } } },
      salesRepresentative: { select: { name: true, email: true } },
      messages: { select: { body: true, senderRole: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ escalatedAt: "desc" }, { lastMessageAt: "desc" }],
    take: 200,
  });
  type ClientConversation = (typeof conversations)[number] & { clientUser: NonNullable<(typeof conversations)[number]["clientUser"]> };
  const clientConversations = conversations.filter((conversation): conversation is ClientConversation => Boolean(conversation.clientUser));
  const selected = clientConversations.find((conversation) => conversation.id === requestedConversationId) || clientConversations[0];
  const explicitSelection = Boolean(requestedConversationId && selected?.id === requestedConversationId);
  const unreadCount = clientConversations.filter((conversation) => conversation.lastClientMessageAt && (!conversation.staffReadAt || conversation.staffReadAt < conversation.lastClientMessageAt)).length;
  const escalatedCount = clientConversations.filter((conversation) => conversation.escalatedAt).length;
  const messages = selected ? await prisma.supportMessage.findMany({
    where: { conversationId: selected.id },
    include: { senderUser: { select: { name: true, email: true, isAdmin: true } } },
    orderBy: { createdAt: "asc" },
    take: 300,
  }) : [];
  if (selected) {
    const now = new Date();
    await prisma.$transaction([
      prisma.supportMessage.updateMany({ where: { conversationId: selected.id, senderRole: "CLIENT", readAt: null }, data: { readAt: now } }),
      prisma.supportConversation.update({ where: { id: selected.id }, data: { staffReadAt: now } }),
    ]);
  }
  return (
    <>
      <DoneNotice done={done} />
      <ChatWorkspaceHeading
        eyebrow="Apoio ao cliente"
        title="Caixa de entrada"
        description={staff.role === "ADMIN" ? "Todas as conversas de clientes num só lugar. Os pedidos sem resposta durante 24 horas sobem automaticamente para a Administração." : "Responde aos teus clientes. A Administração é avisada automaticamente se uma mensagem ficar 24 horas sem resposta."}
        total={clientConversations.length}
        totalLabel="clientes"
        alert={unreadCount}
      />
      <ChatTabs mode="clients" role={staff.role} />

      {!selected ? (
        <section className="rounded-[24px] border border-[#DCC9AA] bg-white p-10 text-center shadow-[0_12px_36px_rgba(72,48,21,0.05)]">
          <MessageCircleMore className="mx-auto text-[#A97936]" size={34} />
          <h2 className="mt-3 text-2xl font-semibold">Ainda não há mensagens</h2>
          <p className="mt-2 text-sm text-[#6B6258]">As novas conversas de clientes aparecem aqui automaticamente.</p>
        </section>
      ) : (
        <section className="grid min-h-[570px] w-full min-w-0 overflow-hidden rounded-[26px] border border-[#DCC9AA] bg-white shadow-[0_16px_46px_rgba(72,48,21,0.07)] lg:h-[calc(100vh-310px)] lg:min-h-[620px] lg:max-h-[790px] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${explicitSelection ? "hidden lg:flex" : "flex"} min-w-0 flex-col overflow-hidden bg-[#FFF9F0] lg:border-r lg:border-[#E2D3BC]`}>
            <div className="flex items-center justify-between border-b border-[#E9DDCC] px-4 py-3.5">
              <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Conversas</p><p className="mt-1 text-xs text-[#776B5E]">{unreadCount} por ler · {escalatedCount} escaladas</p></div>
              <span className="grid h-9 min-w-9 place-items-center rounded-full bg-[#17130F] px-2 text-xs font-black text-white">{clientConversations.length}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5">
              {clientConversations.map((conversation) => {
                const active = conversation.id === selected.id;
                const unread = Boolean(conversation.lastClientMessageAt && (!conversation.staffReadAt || conversation.staffReadAt < conversation.lastClientMessageAt));
                const name = conversation.clientUser.name || conversation.clientUser.email;
                return (
                  <Link key={conversation.id} href={`/backoffice/chat?mode=clients&client=${conversation.id}`} className={`group flex min-w-0 gap-3 rounded-[18px] p-3 transition ${active ? "bg-[#17130F] text-white" : "hover:bg-white"}`}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] text-sm font-black ${active ? "bg-[#D7B267] text-[#17130F]" : "bg-[#EDE2D1] text-[#76562F]"}`}>{name.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm font-bold">{name}</p>{unread && <span className="relative flex h-2.5 w-2.5 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" /><span className="relative h-2.5 w-2.5 rounded-full bg-red-500" /></span>}</div>
                      <p className={`mt-0.5 truncate text-[10px] ${active ? "text-white/45" : "text-[#776B5E]"}`}>{conversation.clientUser.restaurants[0]?.name || conversation.clientUser.email}</p>
                      <p className={`mt-1.5 truncate text-xs ${active ? "text-white/65" : "text-[#5F564C]"}`}>{conversation.messages[0]?.body || "Sem mensagem"}</p>
                      <div className="mt-2 flex items-center gap-1.5">{conversation.escalatedAt && <span className="rounded-full bg-[#B94343] px-2 py-0.5 text-[8px] font-black text-white">24H</span>}<span className={`truncate rounded-full px-2 py-0.5 text-[8px] font-bold ${active ? "bg-white/10 text-white/65" : "bg-[#EDE2D1] text-[#6B5436]"}`}>{conversation.salesRepresentative?.name || "Admin"}</span></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <article className={`${explicitSelection ? "flex" : "hidden lg:flex"} min-h-[570px] min-w-0 flex-col lg:min-h-0`}>
            <header className="flex items-center gap-3 border-b border-[#E2D3BC] bg-white px-3 py-3.5 sm:px-5">
              <Link href="/backoffice/chat?mode=clients" aria-label="Voltar às conversas" className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-[#E2D3BC] text-[#6B5436] lg:hidden"><ArrowLeft size={18} /></Link>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#F1E6D5] text-sm font-black text-[#76562F]">{(selected.clientUser.name || selected.clientUser.email).charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold sm:text-base">{selected.clientUser.name || selected.clientUser.email}</p><p className="mt-0.5 truncate text-[10px] text-[#776B5E] sm:text-xs">{selected.clientUser.restaurants[0]?.name || selected.clientUser.email} · {selected.salesRepresentative?.name || "Administração"}</p></div>
              {selected.escalatedAt && <span className="shrink-0 rounded-full bg-[#B94343] px-2.5 py-1 text-[8px] font-black text-white sm:text-[9px]">24H · ESCALADO</span>}
            </header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FBF7F1] p-3.5 sm:p-5">
              {!messages.length && <div className="grid h-full min-h-[260px] place-items-center"><div className="max-w-sm text-center"><MessageCircleMore className="mx-auto text-[#C7A66E]" size={32} /><p className="mt-3 font-bold">Conversa pronta</p><p className="mt-1 text-sm leading-6 text-[#776B5E]">Escreve abaixo para iniciar o acompanhamento deste cliente.</p></div></div>}
              {messages.map((message) => {
                const clientMessage = message.senderRole === "CLIENT";
                return <div key={message.id} className={`flex ${clientMessage ? "justify-start" : "justify-end"}`}><div className={`max-w-[88%] rounded-[20px] px-4 py-3 shadow-[0_5px_16px_rgba(80,55,30,0.04)] sm:max-w-[72%] ${clientMessage ? "rounded-bl-md border border-[#E2D3BC] bg-white" : "rounded-br-md bg-[#17130F] text-white"}`}><p className={`mb-1 text-[9px] font-black uppercase tracking-wider ${clientMessage ? "text-[#9B6F3B]" : "text-[#D7B267]"}`}>{clientMessage ? (selected.clientUser.name || "Cliente") : (message.senderUser.name || (message.senderUser.isAdmin ? "Administração" : message.senderUser.email))}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><p className={`mt-2 text-[9px] ${clientMessage ? "text-[#8A7C6D]" : "text-white/40"}`}>{dateTime(message.createdAt)}{!clientMessage && message.readAt ? " · Lida" : ""}</p></div></div>;
              })}
            </div>
            <form action={sendSupportReply} className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_50px] items-center gap-2 border-t border-[#E2D3BC] bg-white p-3 sm:p-4">
              <input type="hidden" name="conversationId" value={selected.id} />
              <textarea name="body" required maxLength={2000} rows={1} placeholder="Responder ao cliente…" className="h-12 min-w-0 w-full resize-none rounded-[18px] border border-[#DCC9AA] bg-[#FFFCF7] px-4 py-[13px] text-sm leading-5 outline-none transition focus:border-[#9B6F3B] focus:ring-2 focus:ring-[#D7B267]/20" />
              <button aria-label="Enviar resposta" className="grid h-[50px] w-[50px] place-items-center rounded-[18px] bg-[#17130F] text-white shadow-[0_8px_20px_rgba(23,19,15,0.18)] transition active:scale-95"><Send size={18} /></button>
            </form>
          </article>
        </section>
      )}
    </>
  );
}

async function renderPartnerSupportInbox(requestedConversationId?: string, done?: string) {
  const conversations = await prisma.supportConversation.findMany({
    where: { partnerId: { not: null } },
    include: {
      partner: { select: { businessName: true, contactName: true, email: true, phone: true, city: true, partnerType: true, status: true } },
      messages: { select: { body: true, senderRole: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 200,
  });
  type PartnerConversation = (typeof conversations)[number] & { partner: NonNullable<(typeof conversations)[number]["partner"]> };
  const partnerConversations = conversations.filter((conversation): conversation is PartnerConversation => Boolean(conversation.partner));
  const selected = partnerConversations.find((conversation) => conversation.id === requestedConversationId) || partnerConversations[0];
  const explicitSelection = Boolean(requestedConversationId && selected?.id === requestedConversationId);
  const unreadCount = partnerConversations.filter((conversation) => conversation.lastClientMessageAt && (!conversation.staffReadAt || conversation.staffReadAt < conversation.lastClientMessageAt)).length;
  const messages = selected ? await prisma.supportMessage.findMany({
    where: { conversationId: selected.id },
    include: { senderUser: { select: { name: true, email: true, isAdmin: true } } },
    orderBy: { createdAt: "asc" },
    take: 300,
  }) : [];
  if (selected) {
    const now = new Date();
    await prisma.$transaction([
      prisma.supportMessage.updateMany({ where: { conversationId: selected.id, senderRole: "PARTNER", readAt: null }, data: { readAt: now } }),
      prisma.supportConversation.update({ where: { id: selected.id }, data: { staffReadAt: now } }),
    ]);
  }
  return (
    <>
      <DoneNotice done={done} />
      <ChatWorkspaceHeading eyebrow="MesaLink Partners" title="Chat dos parceiros" description="Acompanha ajuda, reservas, pagamentos e configuração diretamente com cada parceiro." total={partnerConversations.length} totalLabel="parceiros" alert={unreadCount} />
      <ChatTabs mode="partners" role="ADMIN" />
      {!selected ? (
        <section className="rounded-[24px] border border-[#DCC9AA] bg-white p-10 text-center shadow-[0_12px_36px_rgba(72,48,21,0.05)]"><MessageCircleMore className="mx-auto text-[#A97936]" size={34} /><h2 className="mt-3 text-2xl font-semibold">Ainda não há mensagens</h2><p className="mt-2 text-sm text-[#6B6258]">Quando um parceiro usar a Ajuda, a conversa aparece aqui.</p></section>
      ) : (
        <section className="grid min-h-[570px] w-full min-w-0 overflow-hidden rounded-[26px] border border-[#DCC9AA] bg-white shadow-[0_16px_46px_rgba(72,48,21,0.07)] lg:h-[calc(100vh-310px)] lg:min-h-[620px] lg:max-h-[790px] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${explicitSelection ? "hidden lg:flex" : "flex"} min-w-0 flex-col overflow-hidden bg-[#FFF9F0] lg:border-r lg:border-[#E2D3BC]`}>
            <div className="flex items-center justify-between border-b border-[#E9DDCC] px-4 py-3.5"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Parceiros</p><p className="mt-1 text-xs text-[#776B5E]">{unreadCount} conversas por ler</p></div><span className="grid h-9 min-w-9 place-items-center rounded-full bg-[#17130F] px-2 text-xs font-black text-white">{partnerConversations.length}</span></div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5">
              {partnerConversations.map((conversation) => {
                const active = conversation.id === selected.id;
                const unread = Boolean(conversation.lastClientMessageAt && (!conversation.staffReadAt || conversation.staffReadAt < conversation.lastClientMessageAt));
                return <Link key={conversation.id} href={`/backoffice/chat?mode=partners&partner=${conversation.id}`} className={`flex min-w-0 gap-3 rounded-[18px] p-3 transition ${active ? "bg-[#17130F] text-white" : "hover:bg-white"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] text-sm font-black ${active ? "bg-[#D7B267] text-[#17130F]" : "bg-[#EDE2D1] text-[#76562F]"}`}>{conversation.partner.businessName.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm font-bold">{conversation.partner.businessName}</p>{unread && <span className="relative flex h-2.5 w-2.5 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" /><span className="relative h-2.5 w-2.5 rounded-full bg-red-500" /></span>}</div><p className={`mt-0.5 truncate text-[10px] ${active ? "text-white/45" : "text-[#776B5E]"}`}>{conversation.partner.city || conversation.partner.email}</p><p className={`mt-1.5 truncate text-xs ${active ? "text-white/65" : "text-[#5F564C]"}`}>{conversation.messages[0]?.body || "Sem mensagem"}</p></div></Link>;
              })}
            </div>
          </aside>
          <article className={`${explicitSelection ? "flex" : "hidden lg:flex"} min-h-[570px] min-w-0 flex-col lg:min-h-0`}>
            <header className="flex items-center gap-3 border-b border-[#E2D3BC] bg-white px-3 py-3.5 sm:px-5"><Link href="/backoffice/chat?mode=partners" aria-label="Voltar aos parceiros" className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-[#E2D3BC] text-[#6B5436] lg:hidden"><ArrowLeft size={18} /></Link><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#F1E6D5] text-sm font-black text-[#76562F]">{selected.partner.businessName.charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold sm:text-base">{selected.partner.businessName}</p><p className="mt-0.5 truncate text-[10px] text-[#776B5E] sm:text-xs">{selected.partner.contactName || "Contacto"} · {selected.partner.email}{selected.partner.phone ? ` · ${selected.partner.phone}` : ""}</p></div></header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FBF7F1] p-3.5 sm:p-5">{!messages.length && <div className="grid h-full min-h-[260px] place-items-center"><div className="max-w-sm text-center"><MessageCircleMore className="mx-auto text-[#C7A66E]" size={32} /><p className="mt-3 font-bold">Conversa pronta</p><p className="mt-1 text-sm leading-6 text-[#776B5E]">Escreve abaixo para iniciar o acompanhamento deste parceiro.</p></div></div>}{messages.map((message) => { const partnerMessage = message.senderRole === "PARTNER"; return <div key={message.id} className={`flex ${partnerMessage ? "justify-start" : "justify-end"}`}><div className={`max-w-[88%] rounded-[20px] px-4 py-3 shadow-[0_5px_16px_rgba(80,55,30,0.04)] sm:max-w-[72%] ${partnerMessage ? "rounded-bl-md border border-[#E2D3BC] bg-white" : "rounded-br-md bg-[#17130F] text-white"}`}><p className={`mb-1 text-[9px] font-black uppercase tracking-wider ${partnerMessage ? "text-[#9B6F3B]" : "text-[#D7B267]"}`}>{partnerMessage ? selected.partner.businessName : (message.senderUser.name || "MesaLink")}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><p className={`mt-2 text-[9px] ${partnerMessage ? "text-[#8A7C6D]" : "text-white/40"}`}>{dateTime(message.createdAt)}{!partnerMessage && message.readAt ? " · Lida" : ""}</p></div></div>; })}</div>
            <form action={sendPartnerSupportReply} className="grid grid-cols-[minmax(0,1fr)_50px] items-center gap-2 border-t border-[#E2D3BC] bg-white p-3 sm:p-4"><input type="hidden" name="conversationId" value={selected.id} /><textarea name="body" required maxLength={2000} rows={1} placeholder="Responder ao parceiro…" className="h-12 min-w-0 w-full resize-none rounded-[18px] border border-[#DCC9AA] bg-[#FFFCF7] px-4 py-[13px] text-sm leading-5 outline-none transition focus:border-[#9B6F3B] focus:ring-2 focus:ring-[#D7B267]/20" /><button aria-label="Enviar resposta" className="grid h-[50px] w-[50px] place-items-center rounded-[18px] bg-[#17130F] text-white shadow-[0_8px_20px_rgba(23,19,15,0.18)] transition active:scale-95"><Send size={18} /></button></form>
          </article>
        </section>
      )}
    </>
  );
}
