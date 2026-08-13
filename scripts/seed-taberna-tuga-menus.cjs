/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const menus = [
  {
    title: "Menu de Almoço",
    summary:
      "Prato principal, bebida e café. Sobremesa opcional por mais 2 €.",
    details: `INCLUI
Prato principal — escolher 1 por pessoa
• Risotto de cogumelos
• Bacalhau à Brás
• Carne de porco à alentejana
• Hambúrguer
• Bitoque de novilho ou frango
• Moelas com batatas fritas
• Filetes de pescada
• Secretos de porco preto

Bebida — escolher 1 por pessoa
• Sumo 330 ml
• Copo de vinho da casa — tinto ou branco
• Imperial
• Água 0,5 L

Café
• Café

OPCIONAL
• Sobremesa à escolha: +2 € por pessoa`,
    servicePeriods: ["LUNCH"],
    pricePerPerson: 15.5,
    addOns: [
      {
        name: "Sobremesa à escolha",
        description: "Uma sobremesa à escolha por pessoa.",
        price: 2,
        perGuest: true,
        active: true,
      },
    ],
  },
  {
    title: "Menu de Grupo 1",
    summary:
      "Entradas, prato principal, bebidas durante o jantar e café.",
    details: `COUVERT
• Pão, azeitonas e manteiga de alho

ENTRADAS
• Salada de grão, pimentos e beringela
• Tomatada com ovos
• Linguiça agridoce

PRATOS PRINCIPAIS
• Bacalhau à Brás
• Carne de porco à alentejana

BEBIDAS DURANTE O JANTAR
• Cerveja Sagres
• Vinho da casa Adega de Pegões — tinto ou branco
• Água
• Refrigerantes

CAFÉ
• Café

Existem alternativas vegan e adaptações para alergias/intolerâncias mediante indicação prévia.`,
    servicePeriods: ["LUNCH", "DINNER"],
    pricePerPerson: 23.5,
    addOns: [],
  },
  {
    title: "Menu de Grupo 2",
    summary:
      "Entradas, dois pratos, bebidas, café e sobremesa à escolha.",
    details: `COUVERT
• Pão

ENTRADAS
• Salada de grão, pimentos e beringela
• Linguiça agridoce
• Pica-pau de novilho

PRATOS PRINCIPAIS
• Bacalhau à Brás
• Bife ao alhinho

BEBIDAS DURANTE O JANTAR
• Cerveja Sagres
• Vinho da casa Adega de Pegões — tinto ou branco
• Sangria — tinta ou branca
• Água
• Refrigerantes

CAFÉ
• Café

SOBREMESA — ESCOLHER 1
• Serradura
• Mousse de chocolate
• Baba de camelo

Existem alternativas vegan e adaptações para alergias/intolerâncias mediante indicação prévia.`,
    servicePeriods: ["LUNCH", "DINNER"],
    pricePerPerson: 28.5,
    addOns: [
      {
        name: "Vinho Monte Velho",
        description: "Substituição do vinho da casa por Monte Velho.",
        price: 3,
        perGuest: true,
        active: true,
      },
      {
        name: "Bar aberto",
        description:
          "Bar aberto durante o jantar. Bebidas premium não incluídas.",
        price: 15,
        perGuest: true,
        active: true,
      },
    ],
  },
  {
    title: "Menu de Grupo 3",
    summary:
      "Menu premium com entradas, bacalhau, picanha, bebidas, café e sobremesa.",
    details: `COUVERT
• Pão

ENTRADAS
• Linguiça agridoce
• Pica-pau de atum

PRATOS PRINCIPAIS
• Bacalhau à Brás
• Picanha com batata frita, arroz e feijão preto

BEBIDAS DURANTE O JANTAR
• Cerveja Sagres
• Vinho Monte Velho — tinto ou branco
• Sangria — tinta ou branca
• Água
• Refrigerantes

CAFÉ
• Café

SOBREMESA — ESCOLHER 1
• Serradura
• Mousse de chocolate
• Baba de camelo

Existem alternativas vegan e adaptações para alergias/intolerâncias mediante indicação prévia.`,
    servicePeriods: ["LUNCH", "DINNER"],
    pricePerPerson: 39.5,
    addOns: [
      {
        name: "Bar aberto",
        description:
          "Bar aberto durante o jantar. Bebidas premium não incluídas.",
        price: 15,
        perGuest: true,
        active: true,
      },
    ],
  },
];

async function main() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: "taberna-tuga" },
    select: {
      id: true,
      totalCapacity: true,
      referralDefaultDailyCapacity: true,
      websiteGalleryImage1: true,
    },
  });

  if (!restaurant) {
    throw new Error("Taberna Tuga não encontrada.");
  }

  for (const menu of menus) {
    const existing = await prisma.diningExperience.findFirst({
      where: { restaurantId: restaurant.id, title: menu.title },
      select: { id: true },
    });
    const data = {
      title: menu.title,
      summary: menu.summary,
      details: menu.details,
      servicePeriods: menu.servicePeriods,
      scheduleType: "FLEXIBLE",
      paymentMode: "AT_RESTAURANT",
      startsAt: null,
      durationMinutes: 120,
      salesCloseAt: null,
      pricePerPerson: menu.pricePerPerson,
      capacity:
        restaurant.totalCapacity ||
        restaurant.referralDefaultDailyCapacity ||
        140,
      cancellationHours: 24,
      imageUrl: restaurant.websiteGalleryImage1,
      active: true,
    };

    if (existing) {
      await prisma.diningExperience.update({
        where: { id: existing.id },
        data: {
          ...data,
          addOns: {
            deleteMany: {},
            create: menu.addOns,
          },
        },
      });
    } else {
      await prisma.diningExperience.create({
        data: {
          restaurantId: restaurant.id,
          ...data,
          addOns: { create: menu.addOns },
        },
      });
    }
  }

  const result = await prisma.diningExperience.findMany({
    where: { restaurantId: restaurant.id, active: true },
    orderBy: { pricePerPerson: "asc" },
    select: {
      title: true,
      pricePerPerson: true,
      paymentMode: true,
      servicePeriods: true,
      addOns: { select: { name: true, price: true } },
    },
  });

  console.table(
    result.map((menu) => ({
      menu: menu.title,
      price: `${Number(menu.pricePerPerson).toFixed(2)} €`,
      payment: menu.paymentMode,
      periods: menu.servicePeriods.join(", "),
      extras: menu.addOns.length,
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
