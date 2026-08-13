import { NextResponse } from "next/server";
import { referralInvoiceCutoff } from "@/lib/referral-deadlines";
import { transferPartnerCommission } from "@/lib/referral-payouts";
import { refundReferralWithoutValidInvoice, settleReferralAttendance } from "@/lib/referral-settlement";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
  }

  const now = new Date();
  const attendanceCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const attendanceGroups = await prisma.referralGroup.findMany({
    where: {
      status: "BOOKED",
      desiredDate: { lte: attendanceCutoff },
      payment: { status: "AUTHORIZED", stripePaymentIntentId: { not: null } },
    },
    orderBy: { desiredDate: "asc" },
    select: { id: true },
    take: 50,
  });

  const results = {
    attendanceCaptured: 0,
    attendanceFailed: 0,
    invoiceRefunded: 0,
    invoiceRefundFailed: 0,
    weeklyPaid: 0,
    weeklyPaymentFailed: 0,
  };

  for (const group of attendanceGroups) {
    try {
      await settleReferralAttendance({ groupId: group.id, outcome: "ATTENDED", automatic: true });
      results.attendanceCaptured += 1;
    } catch (error) {
      results.attendanceFailed += 1;
      console.error("Automatic referral attendance settlement failed", group.id, error);
    }
  }

  const expiredInvoices = await prisma.referralPayment.findMany({
    where: {
      status: "CAPTURED_AWAITING_PAYOUT",
      stripeTransferId: null,
      capturedAt: { lte: referralInvoiceCutoff(now) },
      partnerInvoiceStatus: { in: ["MISSING", "REJECTED"] },
    },
    orderBy: { capturedAt: "asc" },
    select: { id: true },
    take: 50,
  });
  for (const payment of expiredInvoices) {
    try {
      const refund = await refundReferralWithoutValidInvoice(payment.id, now);
      if (refund.status === "refunded") results.invoiceRefunded += 1;
    } catch (error) {
      results.invoiceRefundFailed += 1;
      console.error("Automatic referral invoice refund failed", payment.id, error);
    }
  }

  const weeklyPayments = await prisma.referralPayment.findMany({
    where: {
      status: { in: ["CAPTURED_AWAITING_PAYOUT", "TRANSFER_FAILED"] },
      payoutDueAt: { lte: now },
      partnerInvoiceStatus: "VERIFIED",
      partnerInvoiceUrl: { not: null },
    },
    orderBy: { payoutDueAt: "asc" },
    select: { id: true },
    take: 100,
  });
  for (const payment of weeklyPayments) {
    try {
      await transferPartnerCommission(payment.id);
      results.weeklyPaid += 1;
    } catch (error) {
      results.weeklyPaymentFailed += 1;
      console.error("Automatic weekly partner payment failed", payment.id, error);
    }
  }

  return NextResponse.json({ success: true, processedAt: now.toISOString(), ...results });
}

export async function POST(request: Request) {
  return GET(request);
}
