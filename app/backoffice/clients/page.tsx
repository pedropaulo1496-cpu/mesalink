import Link from "next/link";
import { ExternalLink, Mail, MailPlus, MapPin, MessageCircle, Phone, Search } from "lucide-react";
import { extendTrial, grantAiCredits, grantEmails, updateSubscription } from "@/app/admin/actions";
import { DoneNotice, PageHeading, RiskPill, StatCard, buttonClass, dateTime, euroCents, inputClass, shortDate } from "@/components/backoffice/BackofficeUI";
import { type BackofficeClient, getBackofficeClients } from "@/lib/backoffice-data";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { assignClient, inviteRestaurantClient, sendPromotionDirectly } from "../actions";

export const dynamic = "force-dynamic";

export default async function BackofficeClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; done?: string }> }) {
  const staff = await requireStaff();
  const { q = "", done } = await searchParams;
  const [clients, representatives, invitations] = await Promise.all([
    getBackofficeClients(staff, q),
    staff.role === "ADMIN" ? prisma.salesRepresentative.findMany({ where: { active: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    staff.role === "SALES" ? prisma.salesClientInvitation.findMany({ where: { salesRepresentativeId: staff.salesRepresentativeId! }, orderBy: { createdAt: "desc" }, take: 5 }) : Promise.resolve([]),
  ]);
  const highRisk = clients.filter((client) => client.health.riskLevel === "HIGH").length;
  const inactive = clients.filter((client) => client.health.inactiveDays !== null && client.health.inactiveDays >= 14).length;
  const revenue = clients.reduce((sum, client) => sum + client.payments.revenueCents, 0);

  return (
    <>
      <DoneNotice done={done} />
      <PageHeading eyebrow="Carteira" title="Clientes" description={staff.role === "ADMIN" ? "Todos os restaurantes, atividade, risco, consumo, rentabilidade e comercial responsável." : "Os teus clientes, sinais de risco e próxima ação recomendada."} />
      {staff.role === "SALES" && (
        <section className="mt-5 rounded-2xl border border-[#D7B267] bg-[#FFF9EF] p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#17130F] text-[#D7B267]"><MailPlus size={18} /></span><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Novo restaurante</p><h2 className="text-base font-semibold">Convidar e associar à minha carteira</h2><p className="text-[10px] text-[#75695C]">O restaurante recebe um email para entrar ou criar conta. A associação é automática.</p></div></div>
            <form action={inviteRestaurantClient} className="flex w-full gap-2 lg:max-w-lg"><input name="email" type="email" required placeholder="email@restaurante.pt" className={`${inputClass} min-w-0 flex-1`} /><button className={`${buttonClass} shrink-0`}>Enviar convite</button></form>
          </div>
          {invitations.length > 0 && <div className="mt-3 flex flex-wrap gap-2 border-t border-[#E8D7BA] pt-3">{invitations.map((invitation) => { const status = invitation.acceptedAt ? "Associado" : invitation.expiresAt <= new Date() ? "Expirado" : "Enviado"; return <span key={invitation.id} className="rounded-full border border-[#E2D3BC] bg-white px-3 py-1.5 text-[10px]"><strong>{invitation.email}</strong> · {status}</span>; })}</div>}
        </section>
      )}
      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Na carteira" value={clients.length.toString()} note="até 100 resultados" />
        <StatCard label="Risco alto" value={highRisk.toString()} note="contactar hoje" tone={highRisk ? "red" : "green"} />
        <StatCard label="Inativos 14d" value={inactive.toString()} note="sem utilização recente" tone={inactive ? "gold" : "green"} />
        <StatCard label="Receita observada" value={euroCents(revenue)} note="pagamentos Stripe" tone="green" />
      </section>

      <form className="mt-4 flex max-w-xl gap-2" action="/backoffice/clients">
        <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B6F3B]" size={17} /><input name="q" defaultValue={q} placeholder="Nome, email, telefone ou restaurante" className={`${inputClass} pl-11`} /></label>
        <button className={buttonClass}>Procurar</button>
      </form>

      <section className="mt-4 space-y-2.5">
        {clients.map((client) => <ClientCard key={client.id} client={client} staffRole={staff.role} representatives={representatives} />)}
        {!clients.length && <div className="rounded-2xl border border-[#DCC9AA] bg-white p-6 text-center text-[13px] text-[#6B6258]">Nenhum cliente encontrado.</div>}
      </section>
    </>
  );
}

function ClientCard({ client, staffRole, representatives }: { client: BackofficeClient; staffRole: "ADMIN" | "SALES"; representatives: Awaited<ReturnType<typeof prisma.salesRepresentative.findMany>> }) {
  const subscription = client.subscription;
  const planPercent = Number(client.salesPlanCommissionPercent ?? client.salesRepresentative?.defaultPlanCommissionPercent ?? 10);
  const extraPercent = Number(client.salesExtraCommissionPercent ?? client.salesRepresentative?.defaultExtraCommissionPercent ?? 5);
  return (
    <details className="group rounded-2xl border border-[#DCC9AA] bg-white open:shadow-[0_12px_35px_rgba(80,55,30,0.06)]">
      <summary className="cursor-pointer list-none p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-bold">{client.restaurant?.name || client.name || "Sem restaurante"}</h2><RiskPill level={client.health.riskLevel} score={client.health.riskScore} /><Status status={subscription?.status || "SEM PLANO"} /></div>
            <p className="mt-0.5 truncate text-[11px] text-[#6B6258]">{client.email}{client.restaurant?.phone ? ` · ${client.restaurant.phone}` : ""} · {client.salesRepresentative?.name || "sem comercial"}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Mini label="Inatividade" value={client.health.inactiveDays === null ? "Nunca entrou" : `${client.health.inactiveDays} dias`} />
            <Mini label="Emails" value={`${client.sentEmails} / ${subscription?.emailBalance || 0}`} />
            <Mini label="Gastou" value={client.payments.connected ? euroCents(client.payments.revenueCents) : "—"} />
            <Mini label="Comissão" value={euroCents(client.commissionCents)} />
          </div>
        </div>
      </summary>

      <div className="border-t border-[#E5D7C3] p-3.5 sm:p-4">
        {client.restaurant && (client.restaurant.phone || client.restaurant.email || client.restaurant.address) && (
          <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#E6D8C4] bg-[#FFF9F0] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#9B6F3B]">Contacto do restaurante</p>
              <p className="mt-1 truncate text-xs font-bold">{client.restaurant.phone || "Sem telefone"}{client.restaurant.email ? ` · ${client.restaurant.email}` : ""}</p>
              {client.restaurant.address && <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-[#75695C]"><MapPin size={11} />{client.restaurant.address}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              {client.restaurant.phone && <a href={`tel:${client.restaurant.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#D8C5A9] bg-white px-3 text-[10px] font-bold"><Phone size={12} /> Ligar</a>}
              {client.restaurant.phone && <a href={`https://wa.me/${client.restaurant.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#BBD4BA] bg-[#F1FAF0] px-3 text-[10px] font-bold text-[#37613C]"><MessageCircle size={12} /> WhatsApp</a>}
              {client.restaurant.email && <a href={`mailto:${client.restaurant.email}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#D8C5A9] bg-white px-3 text-[10px] font-bold"><Mail size={12} /> Email</a>}
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Info label="Última atividade" value={client.health.lastActivityAt ? dateTime(client.health.lastActivityAt) : "Sem atividade registada"} />
          <Info label="Conta" value={`Criada ${shortDate(client.createdAt)} · ${subscription?.plan || "sem plano"}`} />
          <Info label="Utilização" value={`${client.restaurant?._count.reservations || 0} reservas · ${client.aiCreditsUsed} créditos IA usados`} />
          <Info label="Saldos" value={`${subscription?.aiCredits || 0} créditos · ${subscription?.emailBalance || 0} emails · ${subscription?.whatsappMessageBalance || 0} WhatsApp`} />
          <Info label="Próxima ação" value={client.suggestion} />
        </div>
        {client.health.factors.length > 0 && <p className="mt-3 rounded-2xl bg-[#FFF5E7] px-4 py-3 text-xs font-semibold text-[#805D2E]">Sinais: {client.health.factors.join(" · ")}</p>}

        {staffRole === "ADMIN" ? (
          <details className="mt-4 rounded-xl border border-[#E2D3BC] bg-[#FFFCF7]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-3 text-[12px] font-bold">Ações administrativas <span className="text-[10px] text-[#9B6F3B]">Abrir ferramentas ↓</span></summary>
            <div className="space-y-3 border-t border-[#E8DDCD] p-3.5">
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
              <SmallForm title="Aumentar trial" action={extendTrial} userId={client.id}><input name="days" type="number" min="1" max="365" defaultValue="7" className={inputClass} /><button className={buttonClass}>Adicionar dias</button></SmallForm>
              <SmallForm title="Oferecer créditos IA" action={grantAiCredits} userId={client.id}><input name="amount" type="number" min="1" max="100000" defaultValue="100" className={inputClass} /><input name="reason" defaultValue="Oferta comercial" className={inputClass} /><button className={buttonClass}>Dar créditos</button></SmallForm>
              <SmallForm title="Oferecer emails" action={grantEmails} userId={client.id}><input name="amount" type="number" min="1" max="1000000" defaultValue="1000" className={inputClass} /><input name="reason" defaultValue="Oferta comercial" className={inputClass} /><button className={buttonClass}>Dar emails</button></SmallForm>
              <SmallForm title="Plano e acesso" action={updateSubscription} userId={client.id}><div className="grid grid-cols-2 gap-2"><select name="plan" defaultValue={subscription?.plan || "ESSENTIALS"} className={inputClass}><option value="ESSENTIALS">Essentials</option><option value="GROWTH">Growth</option></select><select name="status" defaultValue={subscription?.status || "TRIAL"} className={inputClass}><option value="TRIAL">Trial</option><option value="ACTIVE">Ativo</option><option value="PAST_DUE">Em atraso</option><option value="CANCELED">Cancelado</option></select></div><button className={buttonClass}>Guardar acesso</button></SmallForm>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              <form action={assignClient} className="rounded-2xl border border-[#E2D3BC] bg-[#FFF9F0] p-4">
                <input type="hidden" name="userId" value={client.id} />
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7B5528]">Comercial e percentagens</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3"><select name="salesRepresentativeId" defaultValue={client.salesRepresentativeId || ""} className={inputClass}><option value="">Sem comercial</option>{representatives.map((rep) => <option key={rep.id} value={rep.id}>{rep.name}</option>)}</select><label className="text-[10px] font-bold text-[#776B5E]">Planos %<input name="planPercent" type="number" min="0" max="100" step="0.01" defaultValue={planPercent} className={`${inputClass} mt-1`} /></label><label className="text-[10px] font-bold text-[#776B5E]">Extras %<input name="extraPercent" type="number" min="0" max="100" step="0.01" defaultValue={extraPercent} className={`${inputClass} mt-1`} /></label></div>
                <button className={`${buttonClass} mt-3`}>Guardar atribuição</button>
              </form>

              <form action={sendPromotionDirectly} className="rounded-2xl border border-[#D7B267] bg-[#FFF6E5] p-4">
                <input type="hidden" name="userId" value={client.id} />
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7B5528]">Criar código Stripe e enviar por email</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-4"><label className="text-[10px] font-bold text-[#776B5E]">Desconto %<input name="percentOff" type="number" min="1" max="100" defaultValue="10" className={`${inputClass} mt-1`} /></label><label className="text-[10px] font-bold text-[#776B5E]">Duração<select name="duration" defaultValue="ONCE" className={`${inputClass} mt-1`}><option value="ONCE">1 cobrança</option><option value="REPEATING">Vários meses</option><option value="FOREVER">Sempre</option></select></label><label className="text-[10px] font-bold text-[#776B5E]">Meses<input name="durationMonths" type="number" min="1" max="24" defaultValue="3" className={`${inputClass} mt-1`} /></label><label className="text-[10px] font-bold text-[#776B5E]">Expira em dias<input name="expiresInDays" type="number" min="1" max="365" defaultValue="30" className={`${inputClass} mt-1`} /></label></div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[180px_1fr]"><input name="code" placeholder="Código opcional" className={inputClass} /><input name="note" placeholder="Mensagem adicional para o email" className={inputClass} /></div>
                <button className={`${buttonClass} mt-3`}>Criar e enviar promoção</button>
              </form>
            </div>
              <p className="text-[11px] text-[#6B6258]">Custo observado: {euroCents(client.totalCostCents)} · margem estimada: {client.payments.connected ? euroCents(client.marginCents) : "—"} · comissão pendente: {euroCents(client.pendingCommissionCents)}</p>
            </div>
          </details>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2"><Link href={`/backoffice/requests?client=${client.id}`} className={buttonClass}>Pedir desconto ou benefício</Link><Link href={`/backoffice/chat`} className="inline-flex h-11 items-center rounded-xl border border-[#D7B267] px-4 text-sm font-bold">Falar com administração</Link></div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">{staffRole === "ADMIN" && client.restaurant && <Link href={`/restaurants/${client.restaurant.id}`} className="inline-flex items-center gap-1 rounded-full border border-[#D7B267] px-4 py-2 text-xs font-bold">Abrir dashboard <ExternalLink size={12} /></Link>}{client.restaurant && <Link href={`/s/${client.restaurant.slug}`} target="_blank" className="inline-flex items-center gap-1 rounded-full border border-[#DCC9AA] px-4 py-2 text-xs font-bold">Website público <ExternalLink size={12} /></Link>}</div>
      </div>
    </details>
  );
}

function SmallForm({ title, action, userId, children }: { title: string; action: (formData: FormData) => Promise<void>; userId: string; children: React.ReactNode }) {
  return <form action={action} className="rounded-xl border border-[#E2D3BC] bg-[#FFF9F0] p-3"><input type="hidden" name="userId" value={userId} /><p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#7B5528]">{title}</p><div className="space-y-2">{children}</div></form>;
}

function Mini({ label, value }: { label: string; value: string }) { return <div className="min-w-[88px] rounded-xl bg-[#F8F2E9] px-2.5 py-2"><p className="text-[8px] font-black uppercase tracking-wider text-[#9B6F3B]">{label}</p><p className="mt-0.5 truncate text-[12px] font-bold">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#F7F0E5] p-2.5"><p className="text-[8px] font-black uppercase tracking-wider text-[#9B6F3B]">{label}</p><p className="mt-1 text-[11px] font-semibold leading-4">{value}</p></div>; }
function Status({ status }: { status: string }) { const active = status === "ACTIVE" || status === "TRIAL"; return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${active ? "bg-[#E5F3E4] text-[#37613C]" : "bg-[#F8E2D9] text-[#964A35]"}`}>{status}</span>; }
