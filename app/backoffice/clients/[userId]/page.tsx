import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, Euro, Mail, MessageCircle, MousePointerClick, Network, Sparkles, Users } from "lucide-react";
import { PageHeading, dateTime, euroCents, shortDate } from "@/components/backoffice/BackofficeUI";
import { getBackofficeClients } from "@/lib/backoffice-data";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function BackofficeClientResultsPage({ params }: { params: Promise<{ userId: string }> }) {
  const staff = await requireStaff();
  const { userId } = await params;
  const client = (await getBackofficeClients(staff, userId)).find((row) => row.id === userId);
  if (!client?.restaurant) notFound();

  const restaurant = client.restaurant;
  // This force-dynamic report intentionally evaluates its 30-day window per request.
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [reservations, actions, emailCategories, whatsappCategories, customerCount] = await Promise.all([
    prisma.reservation.findMany({ where: { restaurantId: restaurant.id, createdAt: { gte: since } }, select: { guests: true, source: true, status: true, estimatedRevenue: true } }),
    prisma.marketingAction.findMany({ where: { restaurantId: restaurant.id, createdAt: { gte: since } }, select: { openedAt: true, clickedAt: true, convertedAt: true, customerId: true, estimatedRevenue: true, actualRevenue: true } }),
    prisma.emailUsage.groupBy({ by: ["category"], where: { restaurantId: restaurant.id, createdAt: { gte: since }, status: "SENT" }, _count: { _all: true } }),
    prisma.whatsAppUsage.groupBy({ by: ["category"], where: { restaurantId: restaurant.id, createdAt: { gte: since }, status: "SENT" }, _count: { _all: true } }),
    prisma.customer.count({ where: { restaurantId: restaurant.id } }),
  ]);

  const validReservations = reservations.filter((row) => !["CANCELLED", "REJECTED", "NO_SHOW"].includes(row.status));
  const onlineReservations = validReservations.filter((row) => row.source !== "MANUAL");
  const partnerReservations = validReservations.filter((row) => row.source === "PARTNER_NETWORK");
  const opened = actions.filter((row) => row.openedAt).length;
  const clicked = actions.filter((row) => row.clickedAt).length;
  const convertedActions = actions.filter((row) => row.convertedAt);
  const recoveredCustomers = new Set(convertedActions.map((row) => row.customerId).filter(Boolean)).size;
  const reservationRevenue = onlineReservations.reduce((sum, row) => sum + Number(row.estimatedRevenue || 0), 0);
  const recoveredRevenue = convertedActions.reduce((sum, row) => sum + Number(row.actualRevenue ?? row.estimatedRevenue ?? 0), 0);
  const emailCount = emailCategories.reduce((sum, row) => sum + row._count._all, 0);
  const whatsappCount = whatsappCategories.reduce((sum, row) => sum + row._count._all, 0);

  return (
    <>
      <Link href="/backoffice/clients" className="inline-flex items-center gap-2 text-xs font-bold text-[#7A542A]"><ArrowLeft size={14} /> Voltar aos clientes</Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading eyebrow="Resultados por restaurante" title={restaurant.name} description={`Últimos 30 dias · conta criada em ${shortDate(client.createdAt)} · ${client.subscription?.plan || "sem plano"}`} />
        <span className="w-fit rounded-full border border-[#D7B267] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em]">Atualizado agora</span>
      </div>

      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<CalendarCheck size={17} />} label="Reservas ganhas" value={onlineReservations.length.toString()} note={`${onlineReservations.reduce((sum, row) => sum + row.guests, 0)} pessoas`} />
        <Metric icon={<Network size={17} />} label="Rede de Parceiros" value={partnerReservations.length.toString()} note={`${partnerReservations.reduce((sum, row) => sum + row.guests, 0)} pessoas`} />
        <Metric icon={<Sparkles size={17} />} label="Clientes recuperados" value={recoveredCustomers.toString()} note={`${convertedActions.length} conversões`} />
        <Metric icon={<Euro size={17} />} label="Impacto estimado" value={euroCents(Math.round((reservationRevenue + recoveredRevenue) * 100))} note="reservas + recuperação" tone="dark" />
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-2xl border border-[#DCC9AA] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Aquisição</p><h2 className="mt-1 text-xl font-semibold">De onde chegaram as reservas</h2></div><Users className="text-[#A97936]" size={22} /></div>
          <div className="mt-4 space-y-2">{sourceRows(reservations).map((row) => <ResultRow key={row.label} label={row.label} value={`${row.count} reservas · ${row.guests} pessoas`} />)}{!reservations.length && <Empty text="Ainda não existem reservas nos últimos 30 dias." />}</div>
        </article>

        <article className="rounded-2xl border border-[#DCC9AA] bg-white p-4 sm:p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Marketing e Revenue AI</p><h2 className="mt-1 text-xl font-semibold">O que aconteceu depois do envio</h2>
          <div className="mt-4 grid grid-cols-2 gap-2"><SmallMetric icon={<Mail size={14} />} label="Emails" value={emailCount} /><SmallMetric icon={<MessageCircle size={14} />} label="WhatsApp" value={whatsappCount} /><SmallMetric icon={<Mail size={14} />} label="Aberturas" value={opened} /><SmallMetric icon={<MousePointerClick size={14} />} label="Cliques" value={clicked} /></div>
          <div className="mt-3 rounded-xl bg-[#EDF6EB] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[#4A704D]">Conversões atribuídas</p><p className="mt-1 text-2xl font-semibold">{convertedActions.length}</p></div>
        </article>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Info label="Base de clientes" value={`${customerCount} contactos`} />
        <Info label="Utilização total" value={`${client.restaurant._count.reservations} reservas · ${client.aiCreditsUsed} créditos IA`} />
        <Info label="Última atividade" value={client.health.lastActivityAt ? dateTime(client.health.lastActivityAt) : "Sem atividade"} />
        <Info label="Estado da conta" value={`${client.subscription?.status || "SEM PLANO"} · ${client.health.inactiveDays === null ? "nunca entrou" : `${client.health.inactiveDays} dias sem entrar`}`} />
      </section>
    </>
  );
}

function sourceRows(rows: Array<{ source: string; guests: number }>) {
  const labels: Record<string, string> = { MANUAL: "Criadas pela equipa", PUBLIC: "Reserva pública", WEBSITE: "Website", GOOGLE: "Google", PARTNER_NETWORK: "Rede de Parceiros" };
  const grouped = new Map<string, { count: number; guests: number }>();
  for (const row of rows) { const current = grouped.get(row.source) || { count: 0, guests: 0 }; current.count += 1; current.guests += row.guests; grouped.set(row.source, current); }
  return [...grouped.entries()].map(([source, value]) => ({ label: labels[source] || source.replaceAll("_", " "), ...value })).sort((a, b) => b.count - a.count);
}

function Metric({ icon, label, value, note, tone = "light" }: { icon: React.ReactNode; label: string; value: string; note: string; tone?: "light" | "dark" }) { return <article className={`rounded-2xl border p-4 ${tone === "dark" ? "border-[#17130F] bg-[#17130F] text-white" : "border-[#DCC9AA] bg-white"}`}><div className="flex items-center gap-2 text-[#B27A31]">{icon}<p className="text-[9px] font-black uppercase tracking-[0.14em]">{label}</p></div><p className="mt-2 text-2xl font-semibold">{value}</p><p className={`mt-1 text-[10px] ${tone === "dark" ? "text-white/55" : "text-[#75695C]"}`}>{note}</p></article>; }
function SmallMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="rounded-xl bg-[#F7F0E5] p-3"><div className="flex items-center gap-1.5 text-[#9B6F3B]">{icon}<span className="text-[8px] font-black uppercase tracking-wider">{label}</span></div><p className="mt-1 text-xl font-semibold">{value}</p></div>; }
function ResultRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F2E9] px-3 py-2.5"><span className="text-xs font-bold">{label}</span><span className="text-[11px] text-[#6B6258]">{value}</span></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#DCC9AA] bg-[#FFF9F0] p-3.5"><p className="text-[8px] font-black uppercase tracking-wider text-[#9B6F3B]">{label}</p><p className="mt-1.5 text-xs font-bold">{value}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed border-[#DCC9AA] p-4 text-center text-xs text-[#75695C]">{text}</p>; }
