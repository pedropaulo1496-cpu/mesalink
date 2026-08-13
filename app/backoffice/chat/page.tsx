import Link from "next/link";
import { MessageCircleMore, Send } from "lucide-react";
import { DoneNotice, PageHeading, dateTime } from "@/components/backoffice/BackofficeUI";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { sendCommercialMessage } from "../actions";

export const dynamic = "force-dynamic";

export default async function CommercialChatPage({
  searchParams,
}: {
  searchParams: Promise<{ rep?: string; done?: string }>;
}) {
  const staff = await requireStaff();
  const { rep: requestedRepresentativeId, done } = await searchParams;
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
                    <Link key={item.id} href={`/backoffice/chat?rep=${item.id}`} className={`min-w-[220px] rounded-2xl p-3 lg:block lg:min-w-0 ${active ? "bg-[#17130F] text-white" : "hover:bg-[#F3E8D7]"}`}>
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
