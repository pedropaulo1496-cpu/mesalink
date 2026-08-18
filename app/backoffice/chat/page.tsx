import Link from "next/link";
import { MessageCircleMore, Send } from "lucide-react";
import { DoneNotice, PageHeading, dateTime } from "@/components/backoffice/BackofficeUI";
import { prisma } from "@/lib/prisma";
import { requireStaff, type StaffIdentity } from "@/lib/staff-auth";
import { sendCommercialMessage, sendSupportReply } from "../actions";

export const dynamic = "force-dynamic";

export default async function CommercialChatPage({
  searchParams,
}: {
  searchParams: Promise<{ rep?: string; client?: string; mode?: string; done?: string }>;
}) {
  const staff = await requireStaff();
  const { rep: requestedRepresentativeId, client, mode, done } = await searchParams;
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
      <ChatTabs mode="team" />
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

function ChatTabs({ mode }: { mode: "clients" | "team" }) {
  return <div className="mb-5 inline-flex rounded-2xl border border-[#DCC9AA] bg-white p-1"><Link href="/backoffice/chat?mode=clients" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === "clients" ? "bg-[#17130F] text-white" : "text-[#776B5E]"}`}>Clientes</Link><Link href="/backoffice/chat?mode=team" className={`rounded-xl px-4 py-2 text-sm font-bold ${mode === "team" ? "bg-[#17130F] text-white" : "text-[#776B5E]"}`}>Equipa</Link></div>;
}

async function renderSupportInbox(staff: StaffIdentity, requestedConversationId?: string, done?: string) {
  const conversations = await prisma.supportConversation.findMany({
    where: staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : undefined,
    include: {
      clientUser: { select: { name: true, email: true, restaurants: { select: { name: true }, take: 1, orderBy: { createdAt: "desc" } } } },
      salesRepresentative: { select: { name: true, email: true } },
      messages: { select: { body: true, senderRole: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ escalatedAt: "desc" }, { lastMessageAt: "desc" }],
    take: 200,
  });
  const selected = conversations.find((conversation) => conversation.id === requestedConversationId) || conversations[0];
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
    <ChatTabs mode="clients" />
    <PageHeading eyebrow="Apoio ao cliente" title="Chat dos clientes" description={staff.role === "ADMIN" ? "Acompanha todas as conversas. Pedidos sem resposta do comercial durante 24 horas são destacados e escalados automaticamente para a Administração." : "Responde diretamente aos clientes que te estão atribuídos. A Administração é avisada se uma mensagem ficar 24 horas sem resposta."} />
    {!selected ? <section className="mt-5 rounded-2xl border border-[#DCC9AA] bg-white p-8 text-center"><MessageCircleMore className="mx-auto text-[#A97936]" size={34} /><h2 className="mt-3 text-2xl font-semibold">Ainda não há mensagens de clientes</h2><p className="mt-2 text-sm text-[#6B6258]">As novas conversas aparecem aqui automaticamente.</p></section> :
      <section className="mt-5 grid min-h-[600px] overflow-hidden rounded-2xl border border-[#DCC9AA] bg-white lg:grid-cols-[310px_1fr]">
        <aside className="border-b border-[#E2D3BC] bg-[#FFF9F0] p-3 lg:border-b-0 lg:border-r"><p className="px-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Clientes</p><div className="flex gap-2 overflow-x-auto lg:block lg:max-h-[650px] lg:space-y-1 lg:overflow-y-auto">{conversations.map((conversation) => {
          const active = conversation.id === selected.id;
          const unread = conversation.lastClientMessageAt && (!conversation.staffReadAt || conversation.staffReadAt < conversation.lastClientMessageAt);
          return <Link key={conversation.id} href={`/backoffice/chat?mode=clients&client=${conversation.id}`} className={`min-w-[250px] rounded-2xl p-3 lg:block lg:min-w-0 ${active ? "bg-[#17130F] text-white" : "hover:bg-[#F3E8D7]"}`}><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{conversation.clientUser.name || conversation.clientUser.email}</p>{unread && !active && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#D7B267]" />}</div><p className={`mt-1 truncate text-[10px] ${active ? "text-white/50" : "text-[#776B5E]"}`}>{conversation.clientUser.restaurants[0]?.name || conversation.clientUser.email}</p><div className="mt-2 flex flex-wrap gap-1">{conversation.escalatedAt && <span className="rounded-full bg-[#B94343] px-2 py-0.5 text-[9px] font-black text-white">24H · ESCALADO</span>}<span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${active ? "bg-white/10 text-white/70" : "bg-[#EDE2D1] text-[#6B5436]"}`}>{conversation.salesRepresentative?.name || "Admin"}</span></div><p className={`mt-2 truncate text-xs ${active ? "text-white/65" : "text-[#5F564C]"}`}>{conversation.messages[0]?.body || "Sem mensagem"}</p></Link>;
        })}</div></aside>
        <div className="flex min-h-[550px] flex-col"><header className="border-b border-[#E2D3BC] px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold">{selected.clientUser.name || selected.clientUser.email}</p><p className="mt-0.5 text-xs text-[#776B5E]">{selected.clientUser.email} · {selected.salesRepresentative?.name || "Sem comercial — Administração"}</p></div>{selected.escalatedAt && <span className="rounded-full bg-[#B94343] px-3 py-1 text-[10px] font-black text-white">COMERCIAL SEM RESPOSTA HÁ 24H</span>}</div></header>
          <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#FFFCF7] p-4">{messages.map((message) => { const clientMessage = message.senderRole === "CLIENT"; return <div key={message.id} className={`flex ${clientMessage ? "justify-start" : "justify-end"}`}><div className={`max-w-[85%] rounded-[20px] px-4 py-3 sm:max-w-[70%] ${clientMessage ? "rounded-bl-md border border-[#E2D3BC] bg-white" : "rounded-br-md bg-[#17130F] text-white"}`}><p className={`mb-1 text-[9px] font-black uppercase tracking-wider ${clientMessage ? "text-[#9B6F3B]" : "text-[#D7B267]"}`}>{clientMessage ? (selected.clientUser.name || "Cliente") : (message.senderUser.name || (message.senderUser.isAdmin ? "Administração" : message.senderUser.email))}</p><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className={`mt-2 text-[9px] ${clientMessage ? "text-[#8A7C6D]" : "text-white/40"}`}>{dateTime(message.createdAt)}{!clientMessage && message.readAt ? " · Lida" : ""}</p></div></div>; })}</div>
          <form action={sendSupportReply} className="flex gap-2 border-t border-[#E2D3BC] bg-white p-3 sm:p-4"><input type="hidden" name="conversationId" value={selected.id} /><textarea name="body" required maxLength={2000} rows={2} placeholder="Responder ao cliente…" className="min-h-12 flex-1 resize-none rounded-2xl border border-[#DCC9AA] bg-[#FFFCF7] px-4 py-3 text-sm outline-none focus:border-[#9B6F3B]" /><button aria-label="Enviar resposta" className="flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-2xl bg-[#17130F] text-white"><Send size={18} /></button></form>
        </div>
      </section>}
  </>;
}
