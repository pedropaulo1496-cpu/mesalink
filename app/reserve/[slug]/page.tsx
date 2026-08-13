import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { notFound, redirect } from "next/navigation";
import ReserveForm from "./ReserveForm";
import { marketingBenefitValue } from "@/lib/marketing-card-themes";
import { noShowDepositForReservation, reservationServiceFee } from "@/lib/reservation-commerce";
import { createReservationCheckout, releaseExpiredReservationPayments } from "@/lib/reservation-payments";
import { sendReservationConfirmationEmail } from "@/lib/send-reservation-confirmation-email";

async function createPublicReservation(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") || "");
  const restaurantId = String(formData.get("restaurantId") || "");
  const offerCodeValue = String(formData.get("offerCode") || "").trim().toUpperCase();
  const offerCode = /^MLC-[A-F0-9]{10}$/.test(offerCodeValue) ? offerCodeValue : null;
  const marketingTokenValue = String(formData.get("marketingToken") || "");
  const marketingToken = /^[a-f0-9]{48}$/.test(marketingTokenValue)
    ? marketingTokenValue
    : null;
  const errorRedirect = (error: string) => {
    const query = new URLSearchParams({ error });
    if (marketingToken) query.set("ml_action", marketingToken);
    if (offerCode) query.set("offer", offerCode);
    return `/reserve/${slug}?${query.toString()}`;
  };
  const tableIdValue = String(formData.get("tableId") ?? "");
  const experienceIdValue = String(formData.get("experienceId") || "");
  const addOnIds = Array.from(new Set(formData.getAll("addOnIds").map(String).filter(Boolean)));
  const customerName = String(formData.get("customerName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const birthDateValue = String(formData.get("birthDate") || "").trim();
  const guests = Number(formData.get("guests"));
  const requestedDateValue = String(formData.get("date"));
  let date = new Date(requestedDateValue);
  const reservationMode = String(formData.get("reservationMode") ?? "TABLES");

  if (!customerName || !phone || !email) {
    redirect(errorRedirect("missing"));
  }

  if (!isValidEmail(email)) {
    redirect(errorRedirect("email"));
  }

  const birthDate = birthDateValue
    ? new Date(`${birthDateValue}T12:00:00`)
    : null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!restaurant) notFound();
  await releaseExpiredReservationPayments(restaurant.id);

  const experience = experienceIdValue ? await prisma.diningExperience.findFirst({
    where: {
      id: experienceIdValue,
      restaurantId: restaurant.id,
      active: true,
      OR: [{ scheduleType: "FLEXIBLE" }, { scheduleType: "FIXED", startsAt: { gt: new Date() } }],
    },
    include: {
      addOns: { where: { active: true } },
      reservations: { where: { status: { notIn: ["CANCELLED", "REJECTED", "NO_SHOW"] } }, select: { guests: true } },
    },
  }) : null;
  if (experienceIdValue && !experience) redirect(errorRedirect("experience"));
  if (experience) {
    if (experience.scheduleType === "FIXED") {
      if (!experience.startsAt) redirect(errorRedirect("experience"));
      date = experience.startsAt;
      const sold = experience.reservations.reduce((sum, reservation) => sum + reservation.guests, 0);
      if (sold + guests > experience.capacity) redirect(errorRedirect("capacity"));
    } else {
      if (guests > experience.capacity) redirect(errorRedirect("capacity"));
      const requestedHour = Number(requestedDateValue.match(/T(\d{2}):/)?.[1] ?? date.getHours());
      const requestedPeriod = requestedHour < 17 ? "LUNCH" : "DINNER";
      if (!experience.servicePeriods.includes(requestedPeriod)) redirect(errorRedirect("experience"));
    }
    if (experience.paymentMode !== "AT_RESTAURANT" && (!restaurant.paymentsStripeOnboardingComplete || !restaurant.paymentsStripeAccountId)) redirect(errorRedirect("payment"));
    if (experience.paymentMode === "DEPOSIT" && !experience.depositPerPerson) redirect(errorRedirect("payment"));
  }
  if (Number.isNaN(date.getTime()) || date < new Date()) redirect(errorRedirect("past"));

  const offerCard = offerCode
    ? await prisma.marketingPromoCard.findFirst({
        where: { publicCode: offerCode, restaurantId: restaurant.id },
        include: { customer: { select: { email: true } } },
      })
    : null;
  const offerExpired = Boolean(offerCard?.expiresAt && offerCard.expiresAt <= new Date());
  if (offerCode && (!offerCard || offerCard.status !== "ACTIVE" || offerExpired || offerCard.reservationId)) {
    redirect(errorRedirect("offer"));
  }
  if (offerCard?.customer?.email && offerCard.customer.email.trim().toLowerCase() !== email) {
    redirect(errorRedirect("offer_owner"));
  }

  const subscription = restaurant.user?.subscription;
  const plan = String(subscription?.plan || restaurant.plan || "").toUpperCase();

  const isTrialActive =
    subscription?.status === "TRIAL" &&
    subscription.trialEndsAt &&
    new Date() <= subscription.trialEndsAt;

  const isPaidPlan =
    subscription?.status === "ACTIVE" &&
    ["ESSENTIALS", "GROWTH", "PRO"].includes(plan);

  const isUnlimited = isTrialActive || isPaidPlan;

  if (!isUnlimited) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const startOfNextMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      1,
    );

    const coversThisMonthResult = await prisma.$queryRaw<
      { total: bigint | null }[]
    >`
      SELECT COALESCE(SUM("guests"), 0)::bigint as total
      FROM "Reservation"
      WHERE "restaurantId" = ${restaurant.id}
        AND "source" = 'PUBLIC'
        AND "createdAt" >= ${startOfMonth}
        AND "createdAt" < ${startOfNextMonth}
    `;

    const coversThisMonth = Number(coversThisMonthResult[0]?.total || 0);

    if (coversThisMonth + guests > 100) {
      redirect(errorRedirect("free_limit"));
    }
  }

  let status = String(formData.get("status") ?? "CONFIRMED");
  let approvalReason: string | null = null;

  if (
    restaurant.manualApprovalGuests &&
    guests >= restaurant.manualApprovalGuests
  ) {
    status = "PENDING";
    approvalReason = "LARGE_GROUP";
  }

  if (status === "PENDING" && !approvalReason) {
    approvalReason = "TABLE_MERGE";
  }

  const selectedAddOns = experience
    ? experience.addOns.filter((addOn) => addOnIds.includes(addOn.id))
    : [];
  const experienceBase = experience ? Math.round(Number(experience.pricePerPerson) * guests * 100) / 100 : 0;
  const addOnsAmount = selectedAddOns.reduce(
    (sum, addOn) => sum + Number(addOn.price) * (addOn.perGuest ? guests : 1),
    0,
  );
  const depositQuote = !experience ? noShowDepositForReservation({
    enabled: restaurant.noShowProtectionEnabled,
    minGuests: restaurant.noShowMinGuests,
    depositPerPerson: Number(restaurant.noShowDepositPerPerson),
    fridayEnabled: restaurant.noShowFridayEnabled,
    saturdayEnabled: restaurant.noShowSaturdayEnabled,
    specialDates: restaurant.noShowSpecialDates,
    cancellationHours: restaurant.noShowCancellationHours,
    creditOnLateCancellation: restaurant.noShowCreditOnLateCancellation,
    paymentsReady: Boolean(restaurant.paymentsStripeAccountId && restaurant.paymentsStripeOnboardingComplete),
  }, date, guests) : null;
  const prepaidExperience = experience?.paymentMode === "PREPAID";
  const menuDeposit = experience?.paymentMode === "DEPOSIT"
    ? Math.round(Number(experience.depositPerPerson || 0) * guests * 100) / 100
    : 0;
  const paymentKind = prepaidExperience ? "EXPERIENCE" : menuDeposit > 0 ? "MENU_DEPOSIT" : depositQuote ? "DEPOSIT" : null;
  const paymentBase = prepaidExperience ? experienceBase : menuDeposit || depositQuote?.baseAmount || 0;
  const chargedAddOns = prepaidExperience ? addOnsAmount : 0;
  const paymentServiceFee = prepaidExperience
    ? reservationServiceFee(experienceBase + addOnsAmount)
    : menuDeposit > 0
      ? reservationServiceFee(menuDeposit)
      : depositQuote?.serviceFee || 0;
  const paymentTotal = Math.round((paymentBase + chargedAddOns + paymentServiceFee) * 100) / 100;

  const startDate = date;
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  if (reservationMode === "TABLES" && tableIdValue) {
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        tableId: tableIdValue,
        status: {
          notIn: ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"],
        },
        date: {
          gte: new Date(startDate.getTime() - 2 * 60 * 60 * 1000),
          lt: endDate,
        },
      },
    });

    if (conflictingReservation) {
      redirect(errorRedirect("conflict"));
    }
  }

  if (reservationMode === "CAPACITY") {
    const reservationsInPeriod = await prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        status: {
          notIn: ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"],
        },
        date: {
          gte: new Date(startDate.getTime() - 2 * 60 * 60 * 1000),
          lt: endDate,
        },
      },
    });

    const bookedGuests = reservationsInPeriod.reduce(
      (total, reservation) => total + reservation.guests,
      0,
    );

    const totalCapacity = restaurant.totalCapacity ?? 0;

    if (totalCapacity > 0 && bookedGuests + guests > totalCapacity) {
      status = "PENDING";
      approvalReason = "CAPACITY_LIMIT";
    }
  }

  let customer = await prisma.customer.findFirst({
    where: {
      restaurantId: restaurant.id,
      OR: [{ email }, { phone }],
    },
  });

  if (customer) {
    customer = await prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        name: customerName,
        phone,
        email,
        birthDate: birthDate || customer.birthDate,
        marketingOptIn: true,
        marketingJoinedAt: customer.marketingJoinedAt || new Date(),
        lastReservationAt: date,
        lastVisitAt: date,
        source: customer.source || "PUBLIC_RESERVATION",
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        restaurantId: restaurant.id,
        name: customerName,
        phone,
        email,
        birthDate,
        marketingOptIn: true,
        marketingJoinedAt: new Date(),
        lastReservationAt: date,
        lastVisitAt: date,
        source: "PUBLIC_RESERVATION",
      },
    });
  }

  // Mesmo cliente + mesmo restaurante + exata mesma data/hora já reservada.
  // Cobre duplo-clique / reenvio do formulário: em vez de criar uma 2ª linha,
  // reaproveita-se a reserva existente (ou revive-se se tinha sido cancelada).
  const existingReservation = await prisma.reservation.findFirst({
    where: {
      restaurantId: restaurant.id,
      customerId: customer.id,
      date,
    },
    orderBy: { createdAt: "desc" },
  });

  let finalReservation: { id: string; guests: number; status: string };
  let alreadyBooked = false;

  if (existingReservation && !["CANCELLED", "REJECTED"].includes(existingReservation.status)) {
    // Reserva idêntica já ativa: não criar nada, só avisar o cliente.
    finalReservation = existingReservation;
    alreadyBooked = true;
  } else if (existingReservation) {
    // Havia uma reserva cancelada/rejeitada nesse exato slot: revive-se com os dados novos.
    finalReservation = await prisma.reservation.update({
      where: { id: existingReservation.id },
      data: {
        customerName,
        phone,
        email,
        guests,
        status: paymentKind ? "PENDING_PAYMENT" : status,
        approvalReason,
        tableId: tableIdValue || null,
        experienceId: experience?.id || null,
        estimatedRevenue: experience ? experienceBase + addOnsAmount : guests * (restaurant.averageTicket ?? 25),
        source: "PUBLIC",
      },
    });
  } else {
    try {
      finalReservation = await prisma.reservation.create({
        data: {
          restaurantId: restaurant.id,
          customerId: customer.id,
          customerName,
          phone,
          email,
          guests,
          date,
          status: paymentKind ? "PENDING_PAYMENT" : status,
          approvalReason,
          tableId: tableIdValue || null,
          experienceId: experience?.id || null,
          estimatedRevenue: experience ? experienceBase + addOnsAmount : guests * (restaurant.averageTicket ?? 25),
          source: "PUBLIC",
        },
      });
    } catch (err) {
      // Corrida verdadeira: dois pedidos em paralelo passaram a verificação acima.
      // O constraint único da base de dados rejeitou este; usar o que ganhou a corrida.
      const raceWinner = await prisma.reservation.findFirst({
        where: { restaurantId: restaurant.id, customerId: customer.id, date },
        orderBy: { createdAt: "desc" },
      });

      if (!raceWinner) throw err;
      finalReservation = raceWinner;
      alreadyBooked = true;
    }
  }

  if (alreadyBooked && finalReservation.status === "PENDING_PAYMENT") {
    const existingPayment = await prisma.reservationPayment.findUnique({ where: { reservationId: finalReservation.id } });
    if (existingPayment) {
      const existingCheckoutUrl = await createReservationCheckout(existingPayment.id, slug);
      if (existingCheckoutUrl) redirect(existingCheckoutUrl);
    }
  }

  if (paymentKind) {
    await prisma.$transaction(async (tx) => {
      await tx.reservationExperienceAddOn.deleteMany({ where: { reservationId: finalReservation.id } });
      if (selectedAddOns.length) {
        await tx.reservationExperienceAddOn.createMany({
          data: selectedAddOns.map((addOn) => {
            const quantity = addOn.perGuest ? guests : 1;
            return {
              reservationId: finalReservation.id,
              addOnId: addOn.id,
              nameSnapshot: addOn.name,
              unitPrice: addOn.price,
              quantity,
              totalAmount: Number(addOn.price) * quantity,
            };
          }),
        });
      }
      await tx.reservationPayment.upsert({
        where: { reservationId: finalReservation.id },
        create: {
          reservationId: finalReservation.id,
          restaurantId: restaurant.id,
          kind: paymentKind,
          status: "PENDING",
          confirmationStatus: status,
          marketingTrackingToken: marketingToken,
          offerCode,
          baseAmount: paymentBase,
          addOnsAmount: chargedAddOns,
          serviceFee: paymentServiceFee,
          totalAmount: paymentTotal,
          applicationFee: paymentServiceFee,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
        update: {
          kind: paymentKind,
          status: "PENDING",
          confirmationStatus: status,
          marketingTrackingToken: marketingToken,
          offerCode,
          baseAmount: paymentBase,
          addOnsAmount: chargedAddOns,
          serviceFee: paymentServiceFee,
          totalAmount: paymentTotal,
          applicationFee: paymentServiceFee,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          lastError: null,
        },
      });
      if (offerCard) {
        const claimed = await tx.marketingPromoCard.updateMany({
          where: { id: offerCard.id, status: "ACTIVE", reservationId: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          data: { status: "HELD", reservationId: finalReservation.id },
        });
        if (claimed.count !== 1) throw new Error("OFFER_UNAVAILABLE");
      }
    }).catch((error) => {
      if (error instanceof Error && error.message === "OFFER_UNAVAILABLE") redirect(errorRedirect("offer"));
      throw error;
    });
    const payment = await prisma.reservationPayment.findUnique({ where: { reservationId: finalReservation.id } });
    if (!payment) redirect(errorRedirect("payment"));
    const checkoutUrl = await createReservationCheckout(payment.id, slug);
    if (checkoutUrl) redirect(checkoutUrl);
    redirect(`/reserve/${slug}/success?reservationId=${encodeURIComponent(finalReservation.id)}`);
  }

  if (experience && !alreadyBooked) {
    await prisma.$transaction(async (tx) => {
      await tx.reservationExperienceAddOn.deleteMany({ where: { reservationId: finalReservation.id } });
      if (selectedAddOns.length) {
        await tx.reservationExperienceAddOn.createMany({
          data: selectedAddOns.map((addOn) => {
            const quantity = addOn.perGuest ? guests : 1;
            return {
              reservationId: finalReservation.id,
              addOnId: addOn.id,
              nameSnapshot: addOn.name,
              unitPrice: addOn.price,
              quantity,
              totalAmount: Number(addOn.price) * quantity,
            };
          }),
        });
      }
    });
  }

  if (offerCard) {
    const claimed = await prisma.marketingPromoCard.updateMany({
      where: { id: offerCard.id, status: "ACTIVE", reservationId: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      data: { status: "REDEEMED", redeemedAt: new Date(), reservationId: finalReservation.id },
    });
    if (claimed.count !== 1) redirect(errorRedirect("offer"));
  }

  // Se a reserva já existia e estava ativa, não repetir efeitos secundários
  // (conversão de marketing, email de confirmação) — só avisar o cliente.
  if (!alreadyBooked) {
    const actionToAttribute = await prisma.marketingAction.findFirst({
      where: {
        customerId: customer.id,
        restaurantId: restaurant.id,
        status: { in: ["SENT", "OPENED", "CLICKED", "BOOKED"] },
        ...(marketingToken
          ? { trackingToken: marketingToken }
          : {
              type: {
                in: ["INACTIVE_RECOVERY", "BIRTHDAY", "MANUAL_CAMPAIGN", "AI_CAMPAIGN", "REVIEW_RECOVERY", "CARD_GIFT", "FOLLOW_UP"],
              },
            }),
      },
      orderBy: { sentAt: "desc" },
      select: { id: true },
    });

    if (actionToAttribute) {
      await prisma.marketingAction.update({
        where: { id: actionToAttribute.id },
        data: {
          status: "CONVERTED",
          bookedAt: new Date(),
          convertedAt: new Date(),
          reservationId: finalReservation.id,
          estimatedRevenue: experience ? experienceBase + addOnsAmount : guests * (restaurant.averageTicket ?? 25),
        },
      });
    }

    await sendReservationConfirmationEmail(finalReservation.id);
  }

  redirect(
    `/reserve/${slug}/success?name=${encodeURIComponent(
      customerName,
    )}&guests=${finalReservation.guests}&date=${encodeURIComponent(
      date.toISOString(),
    )}&status=${finalReservation.status}${alreadyBooked ? "&already=1" : ""}${experience ? `&experience=${encodeURIComponent(experience.title)}` : ""}${offerCard ? `&offer=${encodeURIComponent(`${offerCard.title} · ${marketingBenefitValue(offerCard.benefitType, offerCard.value == null ? null : Number(offerCard.value), offerCard.benefitLabel)}`)}` : ""}`,
  );
}

export default async function PublicReservePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; ml_action?: string; offer?: string }>;
}) {
  const { slug } = await params;
  const { error, ml_action: marketingTokenValue, offer: offerCodeValue } = await searchParams;
  const marketingToken =
    typeof marketingTokenValue === "string" &&
    /^[a-f0-9]{48}$/.test(marketingTokenValue)
      ? marketingTokenValue
      : undefined;

  const restaurantIdentity = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } });
  if (!restaurantIdentity) notFound();
  await releaseExpiredReservationPayments(restaurantIdentity.id);

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      tables: {
        include: { reservations: true },
        orderBy: { number: "asc" },
      },
      diningExperiences: {
        where: {
          active: true,
          OR: [{ scheduleType: "FLEXIBLE" }, { scheduleType: "FIXED", startsAt: { gt: new Date() } }],
        },
        include: {
          addOns: { where: { active: true }, orderBy: { createdAt: "asc" } },
          reservations: { where: { status: { notIn: ["CANCELLED", "REJECTED", "NO_SHOW"] } }, select: { guests: true } },
        },
        orderBy: { startsAt: "asc" },
        take: 12,
      },
    },
  });

  if (!restaurant) notFound();

  const requestedOfferCode = typeof offerCodeValue === "string" && /^MLC-[A-F0-9]{10}$/.test(offerCodeValue.toUpperCase())
    ? offerCodeValue.toUpperCase()
    : undefined;
  const offerCard = requestedOfferCode
    ? await prisma.marketingPromoCard.findFirst({
        where: { publicCode: requestedOfferCode, restaurantId: restaurant.id },
        include: { customer: { select: { name: true, email: true, phone: true } } },
      })
    : null;
  const offerAvailable = Boolean(
    offerCard && offerCard.status === "ACTIVE" && !offerCard.reservationId && (!offerCard.expiresAt || offerCard.expiresAt > new Date()),
  );
  const offer = offerCard && offerAvailable ? {
    code: offerCard.publicCode,
    title: offerCard.title,
    description: offerCard.description,
    benefit: marketingBenefitValue(offerCard.benefitType, offerCard.value == null ? null : Number(offerCard.value), offerCard.benefitLabel),
    customerName: offerCard.customer?.name || null,
    customerEmail: offerCard.customer?.email || null,
    customerPhone: offerCard.customer?.phone || null,
    minSpend: offerCard.minSpend ? `Consumo mínimo: ${new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(offerCard.minSpend))}` : null,
    terms: offerCard.terms,
  } : undefined;
  const experiences = restaurant.diningExperiences.map((experience) => ({
        id: experience.id,
        title: experience.title,
        summary: experience.summary,
        details: experience.details,
        servicePeriods: experience.servicePeriods,
        scheduleType: experience.scheduleType,
        paymentMode: experience.paymentMode,
        depositPerPerson: experience.depositPerPerson == null ? null : Number(experience.depositPerPerson),
        startsAt: experience.startsAt?.toISOString() || null,
        pricePerPerson: Number(experience.pricePerPerson),
        capacityRemaining: experience.scheduleType === "FIXED"
          ? Math.max(0, experience.capacity - experience.reservations.reduce((sum, reservation) => sum + reservation.guests, 0))
          : experience.capacity,
        addOns: experience.addOns.map((addOn) => ({ id: addOn.id, name: addOn.name, description: addOn.description, price: Number(addOn.price), perGuest: addOn.perGuest })),
      })).filter((experience) => experience.capacityRemaining > 0 && (experience.paymentMode === "AT_RESTAURANT" || Boolean(restaurant.paymentsStripeAccountId && restaurant.paymentsStripeOnboardingComplete)));
  const noShowRule = {
    enabled: restaurant.noShowProtectionEnabled,
    minGuests: restaurant.noShowMinGuests,
    depositPerPerson: Number(restaurant.noShowDepositPerPerson),
    fridayEnabled: restaurant.noShowFridayEnabled,
    saturdayEnabled: restaurant.noShowSaturdayEnabled,
    specialDates: restaurant.noShowSpecialDates,
    cancellationHours: restaurant.noShowCancellationHours,
    creditOnLateCancellation: restaurant.noShowCreditOnLateCancellation,
    paymentsReady: Boolean(restaurant.paymentsStripeAccountId && restaurant.paymentsStripeOnboardingComplete),
  };
  // Keep the public booking payload deliberately small. Besides loading faster on
  // mobile, this prevents private billing, integration and account fields from
  // ever being serialized into the customer-facing page.
  const publicRestaurant = {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    address: restaurant.address,
    websiteHeroImage: restaurant.websiteHeroImage,
    websiteLogoImage: restaurant.websiteLogoImage,
    reservationMode: restaurant.reservationMode,
    totalCapacity: restaurant.totalCapacity,
    onlineReservationsEnabled: restaurant.onlineReservationsEnabled,
    mondayOpen: restaurant.mondayOpen,
    mondayLunch: restaurant.mondayLunch,
    mondayDinner: restaurant.mondayDinner,
    tuesdayOpen: restaurant.tuesdayOpen,
    tuesdayLunch: restaurant.tuesdayLunch,
    tuesdayDinner: restaurant.tuesdayDinner,
    wednesdayOpen: restaurant.wednesdayOpen,
    wednesdayLunch: restaurant.wednesdayLunch,
    wednesdayDinner: restaurant.wednesdayDinner,
    thursdayOpen: restaurant.thursdayOpen,
    thursdayLunch: restaurant.thursdayLunch,
    thursdayDinner: restaurant.thursdayDinner,
    fridayOpen: restaurant.fridayOpen,
    fridayLunch: restaurant.fridayLunch,
    fridayDinner: restaurant.fridayDinner,
    saturdayOpen: restaurant.saturdayOpen,
    saturdayLunch: restaurant.saturdayLunch,
    saturdayDinner: restaurant.saturdayDinner,
    sundayOpen: restaurant.sundayOpen,
    sundayLunch: restaurant.sundayLunch,
    sundayDinner: restaurant.sundayDinner,
    tables: restaurant.tables,
  };

  return (
    <ReserveForm
      restaurant={publicRestaurant}
      error={error}
      marketingToken={marketingToken}
      offer={offer}
      experiences={experiences}
      noShowRule={noShowRule}
      offerUnavailable={Boolean(requestedOfferCode && !offerAvailable)}
      createPublicReservation={createPublicReservation}
    />
  );
}
