"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAndSendAdminPromotion } from "@/lib/admin-promotions";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { prisma } from "@/lib/prisma";
import { assertBackofficeAdmin, assertClientAccess, assertStaff } from "@/lib/staff-auth";
import { isValidEmail } from "@/lib/validation";
import { getTwilioClient, getTwilioCredentials, normalizeContentSid, normalizeE164 } from "@/lib/revenue-twilio";

const resend = new Resend(process.env.RESEND_API_KEY);

function clean(value: FormDataEntryValue | null, max = 200) {
  return String(value || "").trim().slice(0, max);
}

function numberBetween(value: FormDataEntryValue | null, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`O valor deve estar entre ${min} e ${max}.`);
  }
  return parsed;
}

function finish(path: string, code: string) {
  revalidatePath("/backoffice", "layout");
  redirect(`${path}${path.includes("?") ? "&" : "?"}done=${code}`);
}

async function audit(input: {
  actorId: string;
  targetUserId?: string;
  action: string;
  details?: Prisma.InputJsonValue;
}) {
  await prisma.adminAuditLog.create({ data: input });
}

export async function createSalesRepresentative(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const name = clean(formData.get("name"), 100);
  const email = clean(formData.get("email"), 200).toLowerCase();
  const phone = clean(formData.get("phone"), 40) || null;
  const planPercent = numberBetween(formData.get("planPercent"), 0, 100);
  const extraPercent = numberBetween(formData.get("extraPercent"), 0, 100);
  if (!name || !isValidEmail(email)) throw new Error("Nome e email válidos são obrigatórios.");

  let user = await prisma.user.findUnique({
    where: { email },
    include: { salesProfile: true, _count: { select: { restaurants: true } } },
  });
  if (user?.salesProfile) throw new Error("Este email já pertence a um comercial.");
  if (user && user._count.restaurants > 0) throw new Error("Este email pertence a uma conta de restaurante.");

  user = user || await prisma.user.create({
    data: { name, email },
    include: { salesProfile: true, _count: { select: { restaurants: true } } },
  });

  const salesRepresentative = await prisma.salesRepresentative.create({
    data: {
      userId: user.id,
      name,
      email,
      phone,
      defaultPlanCommissionPercent: planPercent,
      defaultExtraCommissionPercent: extraPercent,
    },
  });
  await sendSalesInvitation({ userId: user.id, name, email });
  await audit({
    actorId: admin.userId,
    targetUserId: user.id,
    action: "SALES_REP_CREATED",
    details: { salesRepresentativeId: salesRepresentative.id, planPercent, extraPercent },
  });
  finish("/backoffice/team", "sales-created");
}

export async function resendSalesInvitation(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const salesRepresentativeId = clean(formData.get("salesRepresentativeId"));
  const rep = await prisma.salesRepresentative.findUnique({
    where: { id: salesRepresentativeId },
    select: { userId: true, name: true, email: true },
  });
  if (!rep) throw new Error("Comercial não encontrado.");
  await sendSalesInvitation(rep);
  await audit({ actorId: admin.userId, targetUserId: rep.userId, action: "SALES_INVITE_RESENT" });
  finish("/backoffice/team", "invite-sent");
}

async function sendSalesInvitation(input: { userId: string; name: string; email: string }) {
  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: input.userId } }),
    prisma.passwordResetToken.create({
      data: { token, userId: input.userId, expiresAt: new Date(Date.now() + 7 * 86_400_000) },
    }),
  ]);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/+$/, "");
  const inviteUrl = `${baseUrl}/reset-password/${token}`;
  const delivery = await resend.emails.send({
    from: "MesaLink <noreply@mesalink.pt>",
    to: input.email,
    subject: "Convite para a equipa comercial MesaLink",
    html: `<div style="font-family:Arial,sans-serif;background:#F4ECDF;padding:32px 14px;color:#17130F"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #DCC9AA;border-radius:28px;padding:34px"><p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:800">MesaLink Backoffice</p><h1 style="font-size:32px">Olá ${escapeHtml(input.name)}, bem-vindo à equipa.</h1><p style="font-size:16px;line-height:1.7;color:#62584E">Foi criada uma conta comercial para consultar os teus clientes, oportunidades, pedidos e comissões.</p><a href="${inviteUrl}" style="display:inline-block;margin-top:20px;background:#17130F;color:white;text-decoration:none;padding:15px 24px;border-radius:999px;font-weight:800">Definir password e entrar</a><p style="margin-top:24px;font-size:12px;color:#8A7C6D">O convite expira em 7 dias.</p></div></div>`,
  });
  requireAcceptedEmail(delivery);
}

export async function updateSalesRepresentative(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const id = clean(formData.get("salesRepresentativeId"));
  const name = clean(formData.get("name"), 100);
  const phone = clean(formData.get("phone"), 40) || null;
  const planPercent = numberBetween(formData.get("planPercent"), 0, 100);
  const extraPercent = numberBetween(formData.get("extraPercent"), 0, 100);
  const active = formData.get("active") === "on";
  const rep = await prisma.salesRepresentative.update({
    where: { id },
    data: {
      name,
      phone,
      active,
      defaultPlanCommissionPercent: planPercent,
      defaultExtraCommissionPercent: extraPercent,
      user: { update: { name } },
    },
    select: { userId: true },
  });
  await audit({
    actorId: admin.userId,
    targetUserId: rep.userId,
    action: "SALES_REP_UPDATED",
    details: { id, active, planPercent, extraPercent },
  });
  finish("/backoffice/team", "sales-updated");
}

export async function assignClient(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const targetUserId = clean(formData.get("userId"));
  const salesRepresentativeId = clean(formData.get("salesRepresentativeId")) || null;
  const planPercent = salesRepresentativeId ? numberBetween(formData.get("planPercent"), 0, 100) : null;
  const extraPercent = salesRepresentativeId ? numberBetween(formData.get("extraPercent"), 0, 100) : null;

  if (salesRepresentativeId) {
    const activeRep = await prisma.salesRepresentative.count({ where: { id: salesRepresentativeId, active: true } });
    if (!activeRep) throw new Error("Comercial inválido ou inativo.");
  }
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      salesRepresentativeId,
      salesPlanCommissionPercent: planPercent,
      salesExtraCommissionPercent: extraPercent,
    },
  });
  await audit({
    actorId: admin.userId,
    targetUserId,
    action: "CLIENT_SALES_REP_ASSIGNED",
    details: { salesRepresentativeId, planPercent, extraPercent },
  });
  finish("/backoffice/clients", "assigned");
}

export async function createCommercialRequest(formData: FormData) {
  const staff = await assertStaff();
  if (staff.role !== "SALES" || !staff.salesRepresentativeId) {
    throw new Error("Apenas comerciais podem criar pedidos.");
  }
  const targetUserId = clean(formData.get("userId"));
  await assertClientAccess(targetUserId);
  const type = clean(formData.get("type")).toUpperCase();
  const limits: Record<string, [number, number]> = {
    DISCOUNT: [1, 100],
    TRIAL: [1, 365],
    AI_CREDITS: [1, 100_000],
    EMAILS: [1, 1_000_000],
  };
  if (!limits[type]) throw new Error("Tipo de pedido inválido.");
  const amount = numberBetween(formData.get("amount"), ...limits[type]);
  const reason = clean(formData.get("reason"), 1000);
  if (!reason) throw new Error("Explique o motivo do pedido.");
  const duration = type === "DISCOUNT" && ["ONCE", "REPEATING", "FOREVER"].includes(clean(formData.get("duration")))
    ? clean(formData.get("duration"))
    : null;
  const durationMonths = duration === "REPEATING"
    ? Math.round(numberBetween(formData.get("durationMonths"), 1, 24))
    : null;

  await prisma.commercialRequest.create({
    data: {
      salesRepresentativeId: staff.salesRepresentativeId,
      targetUserId,
      type,
      amount,
      duration,
      durationMonths,
      reason,
    },
  });
  finish("/backoffice/requests", "request-created");
}

export async function decideCommercialRequest(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const requestId = clean(formData.get("requestId"));
  const decision = clean(formData.get("decision")).toUpperCase();
  const adminNote = clean(formData.get("adminNote"), 1000) || null;
  if (!['APPROVE', 'REJECT'].includes(decision)) throw new Error("Decisão inválida.");

  const request = await prisma.commercialRequest.findUnique({
    where: { id: requestId },
    include: { targetUser: { select: { id: true, email: true } } },
  });
  if (!request || request.status !== "PENDING") throw new Error("Este pedido já foi tratado.");

  if (decision === "REJECT") {
    await prisma.commercialRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", adminNote, decidedById: admin.userId, decidedAt: new Date() },
    });
    await audit({ actorId: admin.userId, targetUserId: request.targetUserId, action: "COMMERCIAL_REQUEST_REJECTED", details: { requestId, type: request.type } });
    finish("/backoffice/requests", "request-rejected");
  }

  const claimed = await prisma.commercialRequest.updateMany({
    where: { id: request.id, status: "PENDING" },
    data: { status: "PROCESSING", adminNote, decidedById: admin.userId, decidedAt: new Date() },
  });
  if (claimed.count !== 1) throw new Error("Este pedido já está a ser tratado.");

  try {
    const amount = Number(request.amount || 0);
    if (request.type === "DISCOUNT") {
      await createAndSendAdminPromotion({
        targetUserId: request.targetUserId,
        createdById: admin.userId,
        requestId: request.id,
        percentOff: Math.round(amount),
        duration: (request.duration || "ONCE") as "ONCE" | "REPEATING" | "FOREVER",
        durationMonths: request.durationMonths || undefined,
        note: adminNote || `Oferta solicitada pelo comercial MesaLink para ${request.targetUser.email}.`,
      });
    } else if (request.type === "TRIAL") {
      const subscription = await prisma.subscription.findUniqueOrThrow({
        where: { userId: request.targetUserId },
        select: { trialEndsAt: true },
      });
      const now = new Date();
      const base = subscription.trialEndsAt && subscription.trialEndsAt > now ? subscription.trialEndsAt : now;
      await prisma.subscription.update({
        where: { userId: request.targetUserId },
        data: { status: "TRIAL", trialEndsAt: new Date(base.getTime() + amount * 86_400_000), restaurantLimit: 1 },
      });
    } else if (request.type === "AI_CREDITS") {
      await prisma.$transaction(async (tx) => {
        const subscription = await tx.subscription.update({
          where: { userId: request.targetUserId },
          data: { aiCredits: { increment: Math.round(amount) } },
          select: { aiCredits: true },
        });
        await tx.aiCreditTransaction.create({
          data: {
            userId: request.targetUserId,
            amount: Math.round(amount),
            balanceAfter: subscription.aiCredits,
            kind: "ADMIN_GRANT",
            feature: "COMMERCIAL_REQUEST",
            description: request.reason.slice(0, 200),
            reference: `commercial_request:${request.id}`,
          },
        });
      });
    } else if (request.type === "EMAILS") {
      await prisma.subscription.update({
        where: { userId: request.targetUserId },
        data: { emailBalance: { increment: Math.round(amount) } },
      });
    }

    await prisma.commercialRequest.update({ where: { id: request.id }, data: { status: "APPROVED" } });
    await audit({
      actorId: admin.userId,
      targetUserId: request.targetUserId,
      action: "COMMERCIAL_REQUEST_APPROVED",
      details: { requestId, type: request.type, amount },
    });
  } catch (error) {
    await prisma.commercialRequest.update({
      where: { id: request.id },
      data: { status: "ERROR", adminNote: error instanceof Error ? error.message.slice(0, 500) : "Falha ao executar pedido" },
    });
    throw error;
  }
  finish("/backoffice/requests", "request-approved");
}

export async function updateRevenueActivationRequest(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const requestId = clean(formData.get("requestId"));
  const nextStatus = clean(formData.get("status")).toUpperCase();
  const adminNote = clean(formData.get("adminNote"), 1000) || null;
  if (!['REQUESTED', 'PREPARING', 'COMPLETED'].includes(nextStatus)) throw new Error("Estado de ativação inválido.");

  const request = await prisma.marketingAction.findFirst({
    where: { id: requestId, type: "CHANNEL_ACTIVATION_REQUEST" },
    include: { restaurant: { select: { id: true, userId: true } } },
  });
  if (!request?.restaurant) throw new Error("Pedido de ativação não encontrado.");
  let details: Record<string, unknown> = {};
  try { details = request.failureReason ? JSON.parse(request.failureReason) : {}; } catch { details = {}; }
  const whatsappNumber = normalizeE164(clean(formData.get("whatsappNumber"), 40));
  const voiceNumber = normalizeE164(clean(formData.get("voiceNumber"), 40));
  const forwardNumber = normalizeE164(clean(formData.get("forwardNumber"), 40));
  const contentSid = normalizeContentSid(clean(formData.get("contentSid"), 80));
  details.whatsappNumber = whatsappNumber;
  details.voiceNumber = voiceNumber;
  details.forwardNumber = forwardNumber;
  details.contentSid = contentSid;
  details.adminNote = adminNote;
  details.updatedBy = admin.userId;
  details.updatedAt = new Date().toISOString();

  if (nextStatus === "COMPLETED") {
    const wantsWhatsapp = request.channel.includes("WHATSAPP");
    const wantsVoice = request.channel.includes("VOICE");
    if (!getTwilioCredentials().configured) throw new Error("Configure primeiro TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN no Vercel.");
    if (wantsWhatsapp && (!whatsappNumber || !contentSid)) throw new Error("Para ativar WhatsApp são necessários o número aprovado e o Content SID.");
    if (wantsVoice && (!voiceNumber || !forwardNumber)) throw new Error("Para ativar chamadas são necessários o número de deteção MesaLink e o telefone público do restaurante.");

    const client = getTwilioClient();
    await client.api.accounts(getTwilioCredentials().accountSid).fetch();
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/+$/, "");
    for (const number of [voiceNumber, whatsappNumber].filter((value): value is string => Boolean(value))) {
      const owned = (await client.incomingPhoneNumbers.list({ phoneNumber: number, limit: 2 })).find((item) => normalizeE164(item.phoneNumber) === number);
      if (number === voiceNumber && !owned) throw new Error(`O número de chamadas ${number} não pertence à conta Twilio MesaLink.`);
      if (owned) await client.incomingPhoneNumbers(owned.sid).update({
        ...(number === voiceNumber ? { voiceUrl: `${baseUrl}/api/revenue-ai/webhooks/twilio/voice/incoming`, voiceMethod: "POST" } : {}),
        ...(number === whatsappNumber ? { smsUrl: `${baseUrl}/api/revenue-ai/webhooks/twilio/whatsapp`, smsMethod: "POST" } : {}),
      });
    }
    await prisma.restaurant.update({
      where: { id: request.restaurant.id },
      data: {
        revenueWhatsappEnabled: wantsWhatsapp,
        revenueWhatsappNumber: wantsWhatsapp ? whatsappNumber : null,
        revenueWhatsappContentSid: wantsWhatsapp ? contentSid : null,
        revenueWhatsappAutoReply: wantsWhatsapp,
        revenueVoiceEnabled: wantsVoice,
        revenueVoiceNumber: wantsVoice ? voiceNumber : null,
        revenueVoiceForwardNumber: wantsVoice ? forwardNumber : null,
        revenueMissedCallAutoReply: wantsVoice && wantsWhatsapp,
        revenueChannelsConfiguredAt: new Date(),
        revenueChannelsLastError: null,
      },
    });
  }

  await prisma.marketingAction.update({ where: { id: request.id }, data: { status: nextStatus, failureReason: JSON.stringify(details) } });
  await audit({
    actorId: admin.userId,
    targetUserId: request.restaurant.userId || undefined,
    action: "REVENUE_CHANNEL_ACTIVATION_UPDATED",
    details: { requestId: request.id, status: nextStatus, channels: request.channel, adminNote },
  });
  finish("/backoffice/requests", "activation-updated");
}

export async function sendPromotionDirectly(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const targetUserId = clean(formData.get("userId"));
  const percentOff = Math.round(numberBetween(formData.get("percentOff"), 1, 100));
  const durationValue = clean(formData.get("duration"));
  const duration = ["ONCE", "REPEATING", "FOREVER"].includes(durationValue)
    ? durationValue as "ONCE" | "REPEATING" | "FOREVER"
    : "ONCE";
  const durationMonths = duration === "REPEATING"
    ? Math.round(numberBetween(formData.get("durationMonths"), 1, 24))
    : undefined;
  const expiresInDays = Math.round(numberBetween(formData.get("expiresInDays"), 1, 365));
  const requestedCode = clean(formData.get("code"), 32);
  const note = clean(formData.get("note"), 1000);
  const promotion = await createAndSendAdminPromotion({
    targetUserId,
    createdById: admin.userId,
    percentOff,
    duration,
    durationMonths,
    expiresInDays,
    requestedCode,
    note,
  });
  await audit({
    actorId: admin.userId,
    targetUserId,
    action: "PROMOTION_SENT",
    details: { promotionId: promotion.id, code: promotion.code, percentOff },
  });
  finish("/backoffice/clients", "promotion-sent");
}

export async function addManualCommission(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const targetUserId = clean(formData.get("userId"));
  const grossAmount = numberBetween(formData.get("grossAmount"), 0.01, 1_000_000);
  const percent = numberBetween(formData.get("percent"), 0, 100);
  const description = clean(formData.get("description"), 200) || "Comissão individual";
  const client = await prisma.user.findUnique({ where: { id: targetUserId }, select: { salesRepresentativeId: true } });
  if (!client?.salesRepresentativeId) throw new Error("Atribua primeiro um comercial a este cliente.");
  const commissionAmount = Math.round(grossAmount * percent) / 100;
  const commission = await prisma.salesCommission.create({
    data: {
      salesRepresentativeId: client.salesRepresentativeId,
      userId: targetUserId,
      sourceType: "MANUAL",
      sourceId: randomUUID(),
      description,
      grossAmount,
      commissionPercent: percent,
      commissionAmount,
    },
  });
  await audit({ actorId: admin.userId, targetUserId, action: "MANUAL_COMMISSION_CREATED", details: { commissionId: commission.id, grossAmount, percent, commissionAmount } });
  finish("/backoffice/commissions", "commission-created");
}

export async function markCommissionPaid(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const commissionId = clean(formData.get("commissionId"));
  const commission = await prisma.salesCommission.update({
    where: { id: commissionId },
    data: { status: "PAID", paidAt: new Date() },
    select: { id: true, userId: true, salesRepresentativeId: true, commissionAmount: true },
  });
  await audit({ actorId: admin.userId, targetUserId: commission.userId, action: "COMMISSION_MARKED_PAID", details: { commissionId, salesRepresentativeId: commission.salesRepresentativeId, amount: Number(commission.commissionAmount) } });
  finish("/backoffice/commissions", "commission-paid");
}

export async function markRepresentativeCommissionsPaid(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const salesRepresentativeId = clean(formData.get("salesRepresentativeId"));
  const pending = await prisma.salesCommission.findMany({
    where: { salesRepresentativeId, status: "PENDING" },
    select: { id: true, commissionAmount: true },
  });
  if (!pending.length) throw new Error("Este comercial não tem comissões pendentes.");
  const paidAt = new Date();
  await prisma.salesCommission.updateMany({
    where: { id: { in: pending.map((item) => item.id) }, status: "PENDING" },
    data: { status: "PAID", paidAt },
  });
  await audit({ actorId: admin.userId, action: "SALES_REP_COMMISSIONS_PAID", details: { salesRepresentativeId, count: pending.length, amount: pending.reduce((sum, item) => sum + Number(item.commissionAmount), 0) } });
  finish("/backoffice/commissions", "commissions-paid");
}

export async function sendCommercialMessage(formData: FormData) {
  const staff = await assertStaff();
  const requestedRepresentativeId = clean(formData.get("salesRepresentativeId"));
  const salesRepresentativeId = staff.role === "ADMIN" ? requestedRepresentativeId : staff.salesRepresentativeId;
  if (!salesRepresentativeId) throw new Error("Conversa inválida.");
  const rep = await prisma.salesRepresentative.count({ where: { id: salesRepresentativeId, active: true } });
  if (!rep) throw new Error("Comercial não encontrado.");
  const body = clean(formData.get("body"), 2000);
  if (!body) throw new Error("Escreva uma mensagem.");
  await prisma.commercialMessage.create({
    data: { salesRepresentativeId, senderUserId: staff.userId, body },
  });
  finish(`/backoffice/chat?rep=${salesRepresentativeId}`, "message-sent");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
