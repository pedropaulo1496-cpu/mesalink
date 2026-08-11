import { Prisma, type DomainOrder } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  buyVercelDomain,
  getVercelDomainOrder,
  isDomainOwnedByVercelAccount,
  provisionVercelProjectDomain,
  quoteVercelDomain,
  type DomainRegistrant,
} from "@/lib/vercel-domains";

const FINISHED_STATUSES = ["ACTIVE", "REFUNDED", "CANCELLED", "DISPUTED"];

function safeFailure(error: unknown) {
  return (error instanceof Error ? error.message : "Erro inesperado")
    .replace(/Bearer\s+\S+/gi, "Bearer [hidden]")
    .slice(0, 500);
}

export function parseDomainRegistrant(value: unknown): DomainRegistrant {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const text = (key: string, max = 160) => String(input[key] || "").trim().slice(0, max);
  const registrant: DomainRegistrant = {
    firstName: text("firstName", 80),
    lastName: text("lastName", 80),
    email: text("email", 254).toLowerCase(),
    phone: text("phone", 24).replace(/[\s()-]/g, ""),
    address1: text("address1", 180),
    address2: text("address2", 180) || undefined,
    city: text("city", 100),
    state: text("state", 100),
    zip: text("zip", 24),
    country: text("country", 2).toUpperCase(),
    companyName: text("companyName", 120) || undefined,
  };

  if (!registrant.firstName || !registrant.lastName) throw new Error("Indica o nome do titular do domínio.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrant.email)) throw new Error("O email do titular não é válido.");
  if (!/^\+[1-9]\d{7,14}$/.test(registrant.phone)) throw new Error("Usa um telefone internacional, por exemplo +351912345678.");
  if (!registrant.address1 || !registrant.city || !registrant.state || !registrant.zip) throw new Error("Preenche a morada completa do titular.");
  if (!/^[A-Z]{2}$/.test(registrant.country)) throw new Error("O país deve usar o código de duas letras, por exemplo PT.");
  return registrant;
}

export function publicDomainOrder(order: DomainOrder | null) {
  if (!order) return null;
  const dnsRecords = Array.isArray(order.dnsRecords)
    ? order.dnsRecords.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const record = item as Record<string, unknown>;
        return [{
          type: String(record.type || ""),
          name: String(record.name || ""),
          value: String(record.value || ""),
        }];
      })
    : [];
  return {
    id: order.id,
    domain: order.domain,
    kind: order.kind,
    status: order.status,
    currency: order.currency,
    providerPriceCents: order.providerPriceCents,
    servicePercentBps: order.servicePercentBps,
    servicePercentCents: order.servicePercentCents,
    serviceFixedCents: order.serviceFixedCents,
    stripeFeeBps: order.stripeFeeBps,
    stripeFeeFixedCents: order.stripeFeeFixedCents,
    stripeFeeCents: order.stripeFeeCents,
    totalCents: order.totalCents,
    dnsRecords,
    failureReason: order.failureReason,
    quoteExpiresAt: order.quoteExpiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() || null,
    purchasedAt: order.purchasedAt?.toISOString() || null,
    verifiedAt: order.verifiedAt?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
  };
}

async function refundDomainOrder(order: DomainOrder, reason: string) {
  if (order.status === "REFUNDED" || order.stripeRefundId) return order;
  let paymentIntentId = order.stripePaymentIntentId;
  if (!paymentIntentId && order.stripeCheckoutSessionId) {
    const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
    paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;
  }
  if (!paymentIntentId) {
    return prisma.domainOrder.update({
      where: { id: order.id },
      data: { status: "FAILED", failureReason: reason, registrant: Prisma.JsonNull },
    });
  }

  const refund = await stripe.refunds.create(
    { payment_intent: paymentIntentId, reason: "requested_by_customer" },
    { idempotencyKey: `domain_order_refund_${order.id}` },
  );
  return prisma.domainOrder.update({
    where: { id: order.id },
    data: {
      status: "REFUNDED",
      stripeRefundId: refund.id,
      refundedAt: new Date(),
      failureReason: reason,
      registrant: Prisma.JsonNull,
    },
  });
}

async function activateOrDescribeDns(order: DomainOrder) {
  const result = await provisionVercelProjectDomain(order.domain);
  const active = result.verified && result.configured;
  const conflict = await prisma.restaurant.findFirst({
    where: {
      customDomain: order.domain,
      id: { not: order.restaurantId },
    },
    select: { id: true },
  });
  if (conflict) return refundDomainOrder(order, "Este domínio já está ligado a outro restaurante MesaLink.");

  if (active) {
    await prisma.$transaction([
      prisma.domainOrder.update({
        where: { id: order.id },
        data: {
          status: "ACTIVE",
          dnsRecords: result.dnsRecords as Prisma.InputJsonValue,
          verification: result.verification as Prisma.InputJsonValue,
          verifiedAt: new Date(),
          failureReason: null,
          registrant: Prisma.JsonNull,
        },
      }),
      prisma.restaurant.update({
        where: { id: order.restaurantId },
        data: { customDomain: order.domain, customDomainVerified: true },
      }),
    ]);
  } else {
    await prisma.domainOrder.update({
      where: { id: order.id },
      data: {
        status: "DNS_PENDING",
        dnsRecords: result.dnsRecords as Prisma.InputJsonValue,
        verification: result.verification as Prisma.InputJsonValue,
        failureReason: null,
      },
    });
  }

  return prisma.domainOrder.findUniqueOrThrow({ where: { id: order.id } });
}

export async function refreshDomainOrder(orderId: string) {
  let order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order || FINISHED_STATUSES.includes(order.status)) return order;

  if (order.status === "CHECKOUT_PENDING" && order.stripeCheckoutSessionId) {
    const checkout = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
    if (checkout.payment_status === "paid") {
      await settleDomainCheckout(checkout);
      return prisma.domainOrder.findUnique({ where: { id: order.id } });
    }
  }

  if (order.kind === "PURCHASE") {
    if (order.providerOrderId) {
      const provider = await getVercelDomainOrder(order.providerOrderId);
      if (provider.status === "failed" || provider.domains.some((item) => item.status === "failed")) {
        return refundDomainOrder(order, "O registo do domínio falhou e o pagamento foi devolvido.");
      }
      if (provider.status !== "completed") return order;
      order = await prisma.domainOrder.update({
        where: { id: order.id },
        data: { status: "PROVISIONING", purchasedAt: order.purchasedAt || new Date(), registrant: Prisma.JsonNull },
      });
    } else if (order.status === "PURCHASING") {
      const owned = await isDomainOwnedByVercelAccount(order.domain);
      if (!owned) return order;
      order = await prisma.domainOrder.update({
        where: { id: order.id },
        data: { status: "PROVISIONING", purchasedAt: new Date(), registrant: Prisma.JsonNull },
      });
    } else {
      return order;
    }
  }

  if (["PAID", "PROVISIONING", "DNS_PENDING"].includes(order.status)) {
    try {
      return await activateOrDescribeDns(order);
    } catch (error) {
      return prisma.domainOrder.update({
        where: { id: order.id },
        data: { status: "DNS_PENDING", failureReason: safeFailure(error) },
      });
    }
  }
  return order;
}

export async function settleDomainCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const orderId = session.metadata?.domainOrderId;
  if (!orderId) throw new Error("Missing domain order metadata");
  let order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Domain order not found");
  if (session.amount_subtotal !== order.totalCents || session.currency?.toUpperCase() !== order.currency) {
    throw new Error("Domain checkout amount mismatch");
  }
  if (FINISHED_STATUSES.includes(order.status)) return;

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error("Missing domain payment intent");
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId = typeof paymentIntent.latest_charge === "string"
    ? paymentIntent.latest_charge
    : paymentIntent.latest_charge?.id;

  order = await prisma.domainOrder.update({
    where: { id: order.id },
    data: {
      status: order.status === "CHECKOUT_PENDING" ? "PAID" : order.status,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId || order.stripeChargeId,
      paidAt: order.paidAt || new Date(),
      failureReason: null,
    },
  });

  if (order.kind === "CONNECT") {
    await refreshDomainOrder(order.id);
    return;
  }
  if (order.providerOrderId || order.status === "PURCHASING") {
    await refreshDomainOrder(order.id);
    return;
  }

  const claimed = await prisma.domainOrder.updateMany({
    where: { id: order.id, status: "PAID" },
    data: { status: "PURCHASING" },
  });
  if (!claimed.count) return;
  order = await prisma.domainOrder.findUniqueOrThrow({ where: { id: order.id } });

  try {
    const current = await quoteVercelDomain(order.domain);
    const expectedPrice = Number(order.providerPrice);
    if (!current.available || Math.abs(current.purchasePrice - expectedPrice) > 0.001) {
      await refundDomainOrder(order, "O domínio deixou de estar disponível ou mudou de preço. O pagamento foi devolvido.");
      return;
    }
    const registrant = parseDomainRegistrant(order.registrant);
    const providerOrderId = await buyVercelDomain({
      domain: order.domain,
      expectedPrice,
      registrant,
    });
    await prisma.domainOrder.update({
      where: { id: order.id },
      data: { providerOrderId, status: "PROVISIONING" },
    });
    await refreshDomainOrder(order.id);
  } catch (error) {
    await refundDomainOrder(order, `${safeFailure(error)} O pagamento foi devolvido.`);
  }
}

export async function markDomainCheckoutFailure(session: Stripe.Checkout.Session, expired = false) {
  const orderId = session.metadata?.domainOrderId;
  if (!orderId) return;
  await prisma.domainOrder.updateMany({
    where: { id: orderId, status: { in: ["QUOTED", "CHECKOUT_PENDING", "PAYMENT_PROCESSING"] } },
    data: {
      status: expired ? "CANCELLED" : "FAILED",
      failureReason: expired ? null : "O pagamento não foi concluído.",
      registrant: Prisma.JsonNull,
    },
  });
}

export async function handleDomainChargeRefund(charge: Stripe.Charge) {
  const order = await prisma.domainOrder.findFirst({
    where: {
      OR: [
        { stripeChargeId: charge.id },
        ...(typeof charge.payment_intent === "string" ? [{ stripePaymentIntentId: charge.payment_intent }] : []),
      ],
    },
  });
  if (!order || charge.amount_refunded < charge.amount) return;
  await prisma.domainOrder.update({
    where: { id: order.id },
    data: { status: "REFUNDED", refundedAt: new Date(), registrant: Prisma.JsonNull },
  });
}

export async function handleDomainChargeDispute(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;
  await prisma.domainOrder.updateMany({
    where: { stripeChargeId: chargeId },
    data: {
      status: "DISPUTED",
      failureReason: `Pagamento contestado no Stripe (${dispute.id}).`,
    },
  });
}
