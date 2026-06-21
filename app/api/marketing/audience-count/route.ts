import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const restaurantId = searchParams.get("restaurantId");
  const segment = searchParams.get("segment") || "ALL";
  const tag = searchParams.get("tag")?.trim();

  if (!restaurantId) {
    return NextResponse.json({ count: 0 });
  }

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  let count = 0;

  const baseWhere = {
    marketingOptIn: true,
    email: {
      not: null,
    },
    reservations: {
      some: {
        restaurantId,
      },
    },
  };

  if (segment === "ALL") {
    count = await prisma.customer.count({
      where: baseWhere,
    });
  }

  if (segment === "VIP") {
    count = await prisma.customer.count({
      where: {
        ...baseWhere,
        vipTier: {
          not: null,
        },
      },
    });
  }

  if (
    segment === "BRONZE" ||
    segment === "SILVER" ||
    segment === "GOLD" ||
    segment === "PLATINUM"
  ) {
    count = await prisma.customer.count({
      where: {
        ...baseWhere,
        vipTier: segment,
      },
    });
  }

  if (segment === "TAG" && tag) {
    count = await prisma.customer.count({
      where: {
        ...baseWhere,
        tags: {
          has: tag,
        },
      },
    });
  }

  if (segment === "INACTIVE") {
    count = await prisma.customer.count({
      where: {
        ...baseWhere,
        OR: [
          { lastVisitAt: { lt: sixtyDaysAgo } },
          { lastReservationAt: { lt: sixtyDaysAgo } },
        ],
      },
    });
  }

  if (segment === "BIRTHDAYS") {
    const customers = await prisma.customer.findMany({
      where: {
        ...baseWhere,
        birthDate: {
          not: null,
        },
      },
      select: {
        birthDate: true,
      },
    });

    const currentMonth = new Date().getMonth();

    count = customers.filter(
      (customer) =>
        customer.birthDate &&
        new Date(customer.birthDate).getMonth() === currentMonth,
    ).length;
  }

  return NextResponse.json({ count });
}