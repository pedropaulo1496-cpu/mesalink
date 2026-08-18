import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BIRTHDAY_RESERVATION_IGNORED_STATUSES, birthdayIsUpcomingThisMonth, calendarMonthRange } from "@/lib/birthday-marketing";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ count: 0 }, { status: 401 });
  const { searchParams } = new URL(request.url);

  const restaurantId = searchParams.get("restaurantId");
  const segment = searchParams.get("segment") || "ALL";
  const tag = searchParams.get("tag")?.trim();

  if (!restaurantId) {
    return NextResponse.json({ count: 0 });
  }

  const restaurant = await prisma.restaurant.findFirst({ where: { id: restaurantId, user: { email: session.user.email } }, select: { id: true } });
  if (!restaurant) return NextResponse.json({ count: 0 }, { status: 404 });

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  let count = 0;

 const baseWhere = {
  restaurantId,
  marketingOptIn: true,
  email: {
    not: null,
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
    const now = new Date();
    const birthdayMonth = calendarMonthRange(now);
    const customers = await prisma.customer.findMany({
      where: {
        ...baseWhere,
        birthDate: {
          not: null,
        },
        reservations: {
          none: {
            date: { gte: birthdayMonth.start, lt: birthdayMonth.end },
            status: { notIn: [...BIRTHDAY_RESERVATION_IGNORED_STATUSES] },
          },
        },
      },
      select: {
        birthDate: true,
      },
    });

    count = customers.filter(
      (customer) =>
        customer.birthDate &&
        birthdayIsUpcomingThisMonth(customer.birthDate, now),
    ).length;
  }

  return NextResponse.json({ count });
}
