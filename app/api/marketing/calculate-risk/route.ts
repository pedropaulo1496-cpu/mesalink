import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function getRiskScore(daysSinceLastVisit: number, totalVisits: number) {
  if (totalVisits >= 20 && daysSinceLastVisit >= 45) return 90;
  if (totalVisits >= 10 && daysSinceLastVisit >= 60) return 75;
  if (totalVisits >= 5 && daysSinceLastVisit >= 75) return 60;
  if (daysSinceLastVisit >= 120) return 50;

  return 0;
}

export async function GET() {
  return calculateRisk();
}

export async function POST() {
  return calculateRisk();
}

async function calculateRisk() {
  try {
    const now = new Date();

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { lastVisitAt: { not: null } },
          { lastReservationAt: { not: null } },
        ],
      },
    });

    let updated = 0;

    const debug = [];

    for (const customer of customers) {
      const lastVisit = customer.lastVisitAt || customer.lastReservationAt;

      if (!lastVisit) continue;

      const daysSinceLastVisit = Math.max(
        0,
        Math.round(
          (now.getTime() - new Date(lastVisit).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      const totalVisits = customer.totalVisits || customer.visitCount || 0;

      const riskScore = getRiskScore(daysSinceLastVisit, totalVisits);

      await prisma.customer.update({
        where: {
          id: customer.id,
        },
        data: {
          riskScore,
        },
      });

      updated++;

      debug.push({
        customer: customer.name,
        totalVisits,
        daysSinceLastVisit,
        riskScore,
      });
    }

    return NextResponse.json({
      success: true,
      customersFound: customers.length,
      updated,
      debug,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}