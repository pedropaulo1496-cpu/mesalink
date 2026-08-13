import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { CalendarDays, CheckCircle2, Clock3, RotateCcw, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyReservationManagementToken } from "@/lib/reservation-management";
import { sendReservationLifecycleEmail } from "@/lib/send-reservation-lifecycle-email";
import { publicReservationUrl } from "@/lib/public-links";
import { settleReservationCancellation } from "@/lib/reservation-payment-cancellation";

export const metadata: Metadata = { title: "Gerir reserva — MesaLink", robots: { index: false, follow: false } };
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];
const BLOCKING_STATUSES = ["PENDING", "CONFIRMED", "SEATED"];

async function updateReservation(formData: FormData) {
  "use server";
  const reservationId = String(formData.get("reservationId") || "");
  const token = String(formData.get("token") || "");
  const dateValue = String(formData.get("date") || "");
  const timeValue = String(formData.get("time") || "");
  const guests = Number(formData.get("guests"));
  const current = await prisma.reservation.findUnique({ where: { id: reservationId }, select: { email: true } });
  if (!current?.email || !verifyReservationManagementToken(reservationId, current.email, token)) notFound();

  const target = lisbonLocalToUtc(dateValue, timeValue);
  if (!target || target <= new Date()) redirect(manageRedirect(reservationId, token, "error", "past"));
  if (!Number.isInteger(guests) || guests < 1 || guests > 500) redirect(manageRedirect(reservationId, token, "error", "guests"));

  try {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { payment: true, restaurant: { include: { tables: { orderBy: { capacity: "asc" } } } } },
      });
      if (!reservation?.restaurant || !reservation.email || !verifyReservationManagementToken(reservation.id, reservation.email, token)) throw new Error("INVALID");
      if (!ACTIVE_STATUSES.includes(reservation.status) || reservation.date <= new Date() || reservation.experienceId || reservation.payment?.status === "PAID") throw new Error("LOCKED");

      const restaurant = reservation.restaurant;
      const end = new Date(target.getTime() + 2 * 60 * 60 * 1000);
      const overlapping = await tx.reservation.findMany({
        where: {
          restaurantId: restaurant.id,
          id: { not: reservation.id },
          status: { in: BLOCKING_STATUSES },
          date: { gte: new Date(target.getTime() - 2 * 60 * 60 * 1000), lt: end },
        },
        select: { guests: true, tableId: true },
      });

      let tableId = reservation.tableId;
      let status = reservation.status;
      let approvalReason: string | null = null;
      if (restaurant.manualApprovalGuests && guests >= restaurant.manualApprovalGuests) {
        status = "PENDING";
        approvalReason = "LARGE_GROUP";
      }

      if (restaurant.reservationMode === "CAPACITY") {
        const occupied = overlapping.reduce((sum, item) => sum + item.guests, 0);
        if ((restaurant.totalCapacity || 0) > 0 && occupied + guests > (restaurant.totalCapacity || 0)) {
          status = "PENDING";
          approvalReason = "CAPACITY_LIMIT";
        }
        tableId = null;
      } else {
        const occupiedTableIds = new Set(overlapping.map((item) => item.tableId).filter(Boolean));
        const currentTable = restaurant.tables.find((table) => table.id === reservation.tableId);
        const currentFits = currentTable && currentTable.capacity >= guests && !occupiedTableIds.has(currentTable.id);
        const availableTable = currentFits ? currentTable : restaurant.tables.find((table) => table.capacity >= guests && !occupiedTableIds.has(table.id));
        if (availableTable) tableId = availableTable.id;
        else {
          tableId = null;
          status = "PENDING";
          approvalReason = approvalReason || "TABLE_MERGE";
        }
      }

      await tx.reservation.update({
        where: { id: reservation.id },
        data: { date: target, guests, tableId, status, approvalReason },
      });
      if (reservation.customerId) {
        await tx.customer.update({ where: { id: reservation.customerId }, data: { lastReservationAt: target } });
      }
      await tx.marketingAction.updateMany({
        where: { reservationId: reservation.id },
        data: { estimatedRevenue: guests * Number(restaurant.averageTicket || 25) },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPDATE";
    redirect(manageRedirect(reservationId, token, "error", code === "LOCKED" ? "locked" : "update"));
  }

  const emailSent = await sendReservationLifecycleEmail(reservationId, "UPDATED");
  redirect(manageRedirect(reservationId, token, "result", emailSent ? "updated" : "updated-no-email"));
}

async function cancelReservation(formData: FormData) {
  "use server";
  const reservationId = String(formData.get("reservationId") || "");
  const token = String(formData.get("token") || "");
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, select: { email: true, status: true, date: true } });
  if (!reservation?.email || !verifyReservationManagementToken(reservationId, reservation.email, token)) notFound();
  if (!ACTIVE_STATUSES.includes(reservation.status) || reservation.date <= new Date()) redirect(manageRedirect(reservationId, token, "error", "locked"));

  const changed = await prisma.reservation.updateMany({
    where: { id: reservationId, status: { in: ACTIVE_STATUSES }, date: { gt: new Date() } },
    data: { status: "CANCELLED", cancelledBy: "CUSTOMER" },
  });
  if (changed.count !== 1) redirect(manageRedirect(reservationId, token, "error", "locked"));
  await settleReservationCancellation(reservationId);
  const emailSent = await sendReservationLifecycleEmail(reservationId, "CANCELLED");
  redirect(manageRedirect(reservationId, token, "result", emailSent ? "cancelled" : "cancelled-no-email"));
}

export default async function ManageReservationPage({ params, searchParams }: { params: Promise<{ reservationId: string }>; searchParams: Promise<{ token?: string; intent?: string; result?: string; error?: string }> }) {
  const { reservationId } = await params;
  const query = await searchParams;
  const token = String(query.token || "");
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { restaurant: { select: { name: true, slug: true, address: true } }, experience: true, payment: true },
  });
  if (!reservation?.email || !reservation.restaurant || !verifyReservationManagementToken(reservation.id, reservation.email, token)) notFound();

  const manageable = ACTIVE_STATUSES.includes(reservation.status) && reservation.date > new Date() && !reservation.experienceId && reservation.payment?.status !== "PAID";
  const cancelled = reservation.status === "CANCELLED";
  const local = lisbonInputParts(reservation.date);
  const resultMessage = manageResultMessage(query.result, reservation.status);
  const errorMessage = manageErrorMessage(query.error);
  const rebookUrl = publicReservationUrl(reservation.restaurant.slug);

  return <main className="min-h-screen bg-[#F5EFE6] px-4 py-8 text-[#17120D] sm:px-6 lg:py-14">
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between gap-4"><div><p className="font-serif text-3xl font-bold"><span className="text-[#C59A55]">Mesa</span>Link</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Gestão segura da reserva</p></div><span className="inline-flex items-center gap-2 rounded-full border border-[#B9D5B8] bg-[#EFF9EF] px-4 py-2 text-xs font-bold text-[#3F6A4D]"><ShieldCheck size={15} /> Link privado</span></header>

      {(resultMessage || errorMessage) && <div className={`mt-6 rounded-[22px] border p-4 text-sm font-semibold ${errorMessage ? "border-[#E7B7A8] bg-[#FFF0EA] text-[#98452F]" : "border-[#B8D7B9] bg-[#EFF9EF] text-[#3F6A4D]"}`}>{errorMessage || resultMessage}</div>}

      <section className="mt-6 overflow-hidden rounded-[38px] border border-[#DCC9AA] bg-white shadow-[0_28px_90px_rgba(73,49,25,0.1)]">
        <div className="bg-[#17120D] p-7 text-white sm:p-9"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D7B267]">{reservation.restaurant.name}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">{cancelled ? "Reserva cancelada" : manageable ? "A sua reserva, sob controlo." : "Esta reserva já não pode ser alterada."}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{cancelled ? "O lugar foi libertado. Se os planos mudarem, pode escolher já uma nova data." : manageable ? "Altere os planos atempadamente ou cancele para ajudar o restaurante a preparar melhor o serviço." : "Para qualquer questão adicional, contacte diretamente o restaurante."}</p></div>
        <div className="grid gap-px bg-[#E6D7C2] sm:grid-cols-3"><Summary icon={<CalendarDays size={18} />} label="Data" value={reservation.date.toLocaleDateString("pt-PT", { dateStyle: "long", timeZone: "Europe/Lisbon" })} /><Summary icon={<Clock3 size={18} />} label="Hora" value={reservation.date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" })} /><Summary icon={<UsersRound size={18} />} label="Pessoas" value={String(reservation.guests)} /></div>
      </section>

      {reservation.payment?.status === "PAID" && !cancelled ? <section className="mt-6 rounded-[34px] border border-[#DCC9AA] bg-[#FFF9F0] p-7 sm:p-9"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#9B6F3B]">{reservation.experience ? "Experiência pré-paga" : "Reserva protegida"}</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.05em]">{reservation.experience?.title || "Depósito confirmado"}</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">Esta reserva tem um pagamento associado e por segurança não pode ser alterada diretamente. Pode cancelá-la; dentro do prazo é devolvido o valor do restaurante, mantendo-se apenas a taxa de serviço. Fora do prazo, o restaurante pode emitir crédito digital quando essa opção estiver ativa.</p><form action={cancelReservation} className="mt-5"><input type="hidden" name="reservationId" value={reservation.id}/><input type="hidden" name="token" value={token}/><button className="h-12 rounded-full border border-[#B96249] bg-white px-6 text-sm font-bold text-[#9A412D]">Cancelar reserva</button></form></section> : cancelled || !manageable ? <section className="mt-6 rounded-[34px] border border-[#DCC9AA] bg-[#FFF9F0] p-7 text-center sm:p-9"><RotateCcw className="mx-auto text-[#9B6F3B]" /><h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">Quer marcar noutra data?</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6B6258]">Consulte novamente a disponibilidade do {reservation.restaurant.name} e faça uma nova reserva em poucos passos.</p><a href={rebookUrl} className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-[#17120D] px-6 text-sm font-bold text-white">Marcar noutra data</a></section> : <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[34px] border border-[#DCC9AA] bg-white p-6 sm:p-8"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Alterar reserva</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Novos planos? Sem problema.</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">Escolha a nova data, hora e número de pessoas. Se for necessária confirmação do restaurante, avisamos imediatamente.</p><form action={updateReservation} className="mt-6 grid gap-4 sm:grid-cols-2"><input type="hidden" name="reservationId" value={reservation.id} /><input type="hidden" name="token" value={token} /><Field label="Data"><input name="date" type="date" min={lisbonInputParts(new Date()).date} defaultValue={local.date} required className="input-premium" /></Field><Field label="Hora"><input name="time" type="time" defaultValue={local.time} required className="input-premium" /></Field><Field label="Número de pessoas" wide><input name="guests" type="number" min="1" max="500" defaultValue={reservation.guests} required className="input-premium" /></Field><button className="sm:col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white"><CheckCircle2 size={16} /> Guardar alteração</button></form></section>
        <section className={`rounded-[34px] border p-6 sm:p-8 ${query.intent === "cancel" ? "border-[#C67861] bg-[#FFF0EA] ring-4 ring-[#E9C4B8]/40" : "border-[#E2C7BD] bg-[#FFF7F3]"}`}><XCircle className="text-[#A14E36]" /><p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#A14E36]">Cancelar reserva</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Não consegue comparecer?</h2><p className="mt-3 text-sm leading-6 text-[#6B6258]">Ao confirmar, a reserva é cancelada e o lugar fica imediatamente disponível. Receberá um email com a confirmação e um botão para escolher outra data.</p><form action={cancelReservation} className="mt-6"><input type="hidden" name="reservationId" value={reservation.id} /><input type="hidden" name="token" value={token} /><button className="inline-flex h-12 w-full items-center justify-center rounded-full border border-[#B96249] bg-white px-5 text-sm font-bold text-[#9A412D]">Confirmar cancelamento</button></form></section>
      </div>}
      <p className="mt-6 text-center text-xs text-[#8B7D6D]">Por segurança, não partilhe este link: permite gerir a sua reserva sem iniciar sessão.</p>
    </div>
  </main>;
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-[#806D56]">{label}</span>{children}</label>; }
function Summary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="bg-[#FFF9F0] p-5"><div className="text-[#9B6F3B]">{icon}</div><p className="mt-3 text-[9px] font-black uppercase tracking-[0.17em] text-[#8B7D6D]">{label}</p><p className="mt-1 font-semibold capitalize">{value}</p></div>; }
function manageRedirect(id: string, token: string, key: "result" | "error", value: string) { return `/reservation/${id}/manage?token=${encodeURIComponent(token)}&${key}=${encodeURIComponent(value)}`; }
function manageResultMessage(result?: string, status?: string) { if (result === "updated") return status === "PENDING" ? "Alteração recebida. A reserva aguarda confirmação do restaurante e enviámos um email com os novos dados." : "Reserva alterada com sucesso. Enviámos um novo email de confirmação."; if (result === "updated-no-email") return "Reserva alterada. Não foi possível enviar o email de confirmação; os dados abaixo já estão atualizados."; if (result === "cancelled") return "Reserva cancelada. Enviámos um email de confirmação com a opção de marcar noutra data."; if (result === "cancelled-no-email") return "Reserva cancelada. Não foi possível enviar o email, mas o lugar já foi libertado."; return ""; }
function manageErrorMessage(error?: string) { if (error === "past") return "Escolha uma data e hora futuras."; if (error === "guests") return "Indique um número de pessoas válido."; if (error === "locked") return "Esta reserva já não pode ser alterada ou cancelada online."; if (error) return "Não foi possível guardar a alteração. Tente novamente."; return ""; }
function lisbonInputParts(date: Date) { const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value])); return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }; }
function lisbonLocalToUtc(dateValue: string, timeValue: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) return null; const [year, month, day] = dateValue.split("-").map(Number); const [hour, minute] = timeValue.split(":").map(Number); if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null; const targetWall = Date.UTC(year, month - 1, day, hour, minute); let instant = new Date(targetWall); for (let index = 0; index < 2; index += 1) { const local = lisbonInputParts(instant); const [localYear, localMonth, localDay] = local.date.split("-").map(Number); const [localHour, localMinute] = local.time.split(":").map(Number); const localWall = Date.UTC(localYear, localMonth - 1, localDay, localHour, localMinute); instant = new Date(instant.getTime() + targetWall - localWall); } return Number.isNaN(instant.getTime()) ? null : instant; }
