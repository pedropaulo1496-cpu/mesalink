import Link from "next/link";
import { MessageCircleMore, Send } from "lucide-react";
import { DoneNotice, PageHeading, dateTime } from "@/components/backoffice/BackofficeUI";
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
      <ChatTabs mode="team" role={staff.role} />
      <PageHeading
        eyebrow="Contacto interno"
        title="Chat da equipa"
        description={staff.role === "ADMIN" ? "Fala diretamente com cada comercial, acompanha pedidos e desbloqueia negócios sem misturar conversas." : "Canal direto com a administração para clientes, propostas, descontos e ajuda comercial."}
      />

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

function ChatTabs({ mode, role }: { mode: "clients" | "partners" | "team"; role: "ADMIN" | "SALES" }) {
  return <div className="mb-5 inline-flex rounded-2xl border border-[#DCC9AA] bg-white p-1"><Link href="/backoffice/chat?mode=clients" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === "clients" ? "bg-[#17130F] text-white" : "text-[#776B5E]"}`}>Clientes</Link>{role === "ADMIN" && <Link href="/backoffice/chat?mode=partners" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === "partners" ? "bg-[#17130F] text-white" : "text-[#776B5E]"}`}>Hotéis e parceiros</Link>}<Link href="/backoffice/chat?mode=team" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === "team" ? "bg-[#17130F] text-white" : "text-[#776B5E]"}`}>Equipa</Link></div>;
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
  return <>
    <DoneNotice done={done} />
    <PageHeading eyebrow="Apoio ao cliente" title="Chat dos clientes" description={staff.role === "ADMIN" ? "Acompanha todas as conversas. Pedidos sem resposta do comercial durante 24 horas são destacados e escalados automaticamente para a Administração." : "Responde diretamente aos clientes que te estão atribuídos. A Administração é avisada se uma mensagem ficar 24 horas sem resposta."} />
    <div className="mt-4"><ChatTabs mode="clients" role={staff.role} /></div>
    {!selected ? <section className="mt-5 rounded-2xl border border-[#DCC9AA] bg-white p-8 text-center"><MessageCircleMore className="mx-auto text-[#A97936]" size={34} /><h2 className="mt-3 text-2xl font-semibold">Ainda não há mensagens de clientes</h2><p className="mt-2 text-sm text-[#6B6258]">As novas conversas aparecem aqui automaticamente.</p></section> :
      <section className="grid w-full min-w-0 max-w-full min-h-[620px] overflow-hidden rounded-[24px] border border-[#DCC9AA] bg-white shadow-[0_14px_40px_rgba(72,48,21,0.06)] lg:h-[calc(100vh-285px)] lg:min-h-[620px] lg:max-h-[780px] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 max-w-full overflow-hidden border-b border-[#E2D3BC] bg-[#FFF9F0] p-3 lg:min-h-0 lg:border-b-0 lg:border-r"><p className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Conversas com clientes</p><div className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-2 lg:block lg:h-[calc(100%-38px)] lg:space-y-1 lg:overflow-y-auto lg:pb-0">{clientConversations.map((conversation) => {
          const active = conversation.id === selected.id;
          const unread = conversation.lastClientMessageAt && (!conversation.staffReadAt || conversation.staffReadAt < conversation.lastClientMessageAt);
          return <Link key={conversation.id} href={`/backoffice/chat?mode=clients&client=${conversation.id}`} className={`min-w-[250px] rounded-2xl p-3 lg:block lg:min-w-0 ${active ? "bg-[#17130F] text-white" : "hover:bg-[#F3E8D7]"}`}><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{conversation.clientUser.name || conversation.clientUser.email}</p>{unread && !active && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#D7B267]" />}</div><p className={`mt-1 truncate text-[10px] ${active ? "text-white/50" : "text-[#776B5E]"}`}>{conversation.clientUser.restaurants[0]?.name || conversation.clientUser.email}</p><div className="mt-2 flex flex-wrap gap-1">{conversation.escalatedAt && <span className="rounded-full bg-[#B94343] px-2 py-0.5 text-[9px] font-black text-white">24H · ESCALADO</span>}<span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${active ? "bg-white/10 text-white/70" : "bg-[#EDE2D1] text-[#6B5436]"}`}>{conversation.salesRepresentative?.name || "Admin"}</span></div><p className={`mt-2 truncate text-xs ${active ? "text-white/65" : "text-[#5F564C]"}`}>{conversation.messages[0]?.body || "Sem mensagem"}</p></Link>;
        })}</div></aside>
        <div className="flex min-h-[520px] min-w-0 flex-col lg:min-h-0"><header className="border-b border-[#E2D3BC] bg-white px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-base font-bold">{selected.clientUser.name || selected.clientUser.email}</p><p className="mt-1 truncate text-xs text-[#776B5E]">{selected.clientUser.email} · {selected.salesRepresentative?.name || "Sem comercial — Administração"}</p></div>{selected.escalatedAt && <span className="rounded-full bg-[#B94343] px-3 py-1 text-[9px] font-black text-white">SEM RESPOSTA HÁ 24H</span>}</div></header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FFFCF7] p-4 sm:p-5">{!messages.length && <div className="grid h-full min-h-[260px] place-items-center"><div className="max-w-sm text-center"><MessageCircleMore className="mx-auto text-[#C7A66E]" size={32} /><p className="mt-3 font-bold">Conversa pronta</p><p className="mt-1 text-sm leading-6 text-[#776B5E]">Ainda não existem mensagens. Escreve abaixo para iniciar o acompanhamento deste cliente.</p></div></div>}{messages.map((message) => { const clientMessage = message.senderRole === "CLIENT"; return <div key={message.id} className={`flex ${clientMessage ? "justify-start" : "justify-end"}`}><div className={`max-w-[88%] rounded-[20px] px-4 py-3 sm:max-w-[72%] ${clientMessage ? "rounded-bl-md border border-[#E2D3BC] bg-white" : "rounded-br-md bg-[#17130F] text-white"}`}><p className={`mb-1 text-[9px] font-black uppercase tracking-wider ${clientMessage ? "text-[#9B6F3B]" : "text-[#D7B267]"}`}>{clientMessage ? (selected.clientUser.name || "Cliente") : (message.senderUser.name || (message.senderUser.isAdmin ? "Administração" : message.senderUser.email))}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><p className={`mt-2 text-[9px] ${clientMessage ? "text-[#8A7C6D]" : "text-white/40"}`}>{dateTime(message.createdAt)}{!clientMessage && message.readAt ? " · Lida" : ""}</p></div></div>; })}</div>
          <form action={sendSupportReply} className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_48px] items-center gap-2 border-t border-[#E2D3BC] bg-white p-3 sm:p-4"><input type="hidden" name="conversationId" value={selected.id} /><textarea name="body" required maxLength={2000} rows={1} placeholder="Responder ao cliente…" className="h-12 min-w-0 w-full resize-none rounded-2xl border border-[#DCC9AA] bg-[#FFFCF7] px-4 py-[13px] text-sm leading-5 outline-none focus:border-[#9B6F3B]" /><button aria-label="Enviar resposta" className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17130F] text-white shadow-[0_8px_20px_rgba(23,19,15,0.18)]"><Send size={18} /></button></form>
        </div>
      </section>}
  </>;
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
  return <>
    <DoneNotice done={done} />
    <div className="mt-4"><ChatTabs mode="partners" role="ADMIN" /></div>
    <PageHeading eyebrow="MesaLink Partners" title="Chat dos hotéis e parceiros" description="Acompanha pedidos de ajuda, reservas, pagamentos e configuração diretamente com cada parceiro." />
    {!selected ? <section className="mt-5 rounded-2xl border border-[#DCC9AA] bg-white p-8 text-center"><MessageCircleMore className="mx-auto text-[#A97936]" size={34} /><h2 className="mt-3 text-2xl font-semibold">Ainda não há mensagens de parceiros</h2><p className="mt-2 text-sm text-[#6B6258]">Quando um hotel ou parceiro usar o botão de ajuda, a conversa aparece aqui.</p></section> :
      <section className="mt-5 grid w-full min-w-0 max-w-full min-h-[620px] overflow-hidden rounded-[24px] border border-[#DCC9AA] bg-white shadow-[0_14px_40px_rgba(72,48,21,0.06)] lg:h-[calc(100vh-285px)] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 overflow-hidden border-b border-[#E2D3BC] bg-[#FFF9F0] p-3 lg:border-b-0 lg:border-r"><p className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Hotéis e parceiros</p><div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:h-[calc(100%-38px)] lg:space-y-1 lg:overflow-y-auto">{partnerConversations.map((conversation) => { const active = conversation.id === selected.id; const unread = conversation.lastClientMessageAt && (!conversation.staffReadAt || conversation.staffReadAt < conversation.lastClientMessageAt); return <Link key={conversation.id} href={`/backoffice/chat?mode=partners&partner=${conversation.id}`} className={`min-w-[250px] rounded-2xl p-3 lg:block lg:min-w-0 ${active ? "bg-[#17130F] text-white" : "hover:bg-[#F3E8D7]"}`}><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{conversation.partner.businessName}</p>{unread && !active && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />}</div><p className={`mt-1 truncate text-[10px] ${active ? "text-white/50" : "text-[#776B5E]"}`}>{conversation.partner.city || conversation.partner.email} · {conversation.partner.partnerType}</p><p className={`mt-2 truncate text-xs ${active ? "text-white/65" : "text-[#5F564C]"}`}>{conversation.messages[0]?.body || "Sem mensagem"}</p></Link>; })}</div></aside>
        <div className="flex min-h-[520px] min-w-0 flex-col"><header className="border-b border-[#E2D3BC] px-5 py-4"><p className="truncate text-base font-bold">{selected.partner.businessName}</p><p className="mt-1 truncate text-xs text-[#776B5E]">{selected.partner.contactName || "Contacto"} · {selected.partner.email}{selected.partner.phone ? ` · ${selected.partner.phone}` : ""}</p></header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FFFCF7] p-4 sm:p-5">{messages.map((message) => { const partnerMessage = message.senderRole === "PARTNER"; return <div key={message.id} className={`flex ${partnerMessage ? "justify-start" : "justify-end"}`}><div className={`max-w-[88%] rounded-[20px] px-4 py-3 sm:max-w-[72%] ${partnerMessage ? "rounded-bl-md border border-[#E2D3BC] bg-white" : "rounded-br-md bg-[#17130F] text-white"}`}><p className={`mb-1 text-[9px] font-black uppercase tracking-wider ${partnerMessage ? "text-[#9B6F3B]" : "text-[#D7B267]"}`}>{partnerMessage ? selected.partner.businessName : (message.senderUser.name || "MesaLink")}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><p className={`mt-2 text-[9px] ${partnerMessage ? "text-[#8A7C6D]" : "text-white/40"}`}>{dateTime(message.createdAt)}{!partnerMessage && message.readAt ? " · Lida" : ""}</p></div></div>; })}</div>
          <form action={sendPartnerSupportReply} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-2 border-t border-[#E2D3BC] bg-white p-3 sm:p-4"><input type="hidden" name="conversationId" value={selected.id} /><textarea name="body" required maxLength={2000} rows={1} placeholder="Responder ao parceiro…" className="h-12 min-w-0 w-full resize-none rounded-2xl border border-[#DCC9AA] bg-[#FFFCF7] px-4 py-[13px] text-sm leading-5 outline-none focus:border-[#9B6F3B]" /><button aria-label="Enviar resposta" className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17130F] text-white"><Send size={18} /></button></form>
        </div>
      </section>}
  </>;
}
