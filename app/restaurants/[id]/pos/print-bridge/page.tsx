import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";

async function createBridgeDevice(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const deviceName = String(formData.get("deviceName") || "PC Principal");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant || !restaurant.userId) return;

  const token = `MLD_${randomBytes(32).toString("hex")}`;

  const device = await prisma.printBridgeDevice.create({
    data: {
      userId: restaurant.userId,
      name: deviceName,
      token,
      restaurants: {
        create: {
          restaurantId: restaurant.id,
          active: true,
        },
      },
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/pos/print-bridge`);
}

async function deleteBridgeDevice(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const bridgeDeviceId = String(formData.get("bridgeDeviceId"));

  if (!restaurantId || !bridgeDeviceId) return;

  await prisma.printBridgeRestaurant.deleteMany({
    where: {
      restaurantId,
      bridgeDeviceId,
    },
  });

  await prisma.printBridgeDevice.update({
    where: {
      id: bridgeDeviceId,
    },
    data: {
      active: false,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/pos/print-bridge`);
}

async function savePrinterMapping(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const bridgeDeviceId = String(formData.get("bridgeDeviceId"));
  const restaurantPrinterId = String(formData.get("restaurantPrinterId"));
  const windowsPrinterName = String(formData.get("windowsPrinterName") || "");

  if (!restaurantId || !bridgeDeviceId || !restaurantPrinterId) return;

  if (!windowsPrinterName) {
    await prisma.printBridgePrinterMapping.deleteMany({
      where: {
        bridgeDeviceId,
        restaurantPrinterId,
      },
    });
  } else {
    await prisma.printBridgePrinterMapping.upsert({
      where: {
        bridgeDeviceId_restaurantPrinterId: {
          bridgeDeviceId,
          restaurantPrinterId,
        },
      },
      create: {
        bridgeDeviceId,
        restaurantPrinterId,
        windowsPrinterName,
      },
      update: {
        windowsPrinterName,
      },
    });
  }

  revalidatePath(`/restaurants/${restaurantId}/pos/print-bridge`);
}

async function testPrinter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const restaurantPrinterId = String(formData.get("restaurantPrinterId"));

  if (!restaurantId || !restaurantPrinterId) return;

  await prisma.printJob.create({
    data: {
      restaurantId,
      printerId: restaurantPrinterId,
      status: "PENDING",
      type: "TEST",
      title: "Teste de impressão",
      payload: {
        source: "PRINT_BRIDGE_TEST",
        productionCenter: {
          name: "Teste de impressão",
        },
        items: [
          {
            id: "test",
            name: "Teste MesaLink Print Bridge",
            quantity: 1,
            notes: "Se este talão saiu, está tudo configurado.",
          },
        ],
        createdAt: new Date(),
      },
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/pos/print-bridge`);
}

export default async function PrintBridgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      printers: {
        orderBy: { name: "asc" },
      },
      printBridgeRestaurants: {
        include: {
          bridgeDevice: {
            include: {
              mappings: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!restaurant) notFound();

  return (
    <main className="flex min-h-screen bg-[#F6F1EA] text-[#171412]">
      <RestaurantSidebar
        id={restaurant.id}
        restaurantName={restaurant.name}
        active="Print Bridge"
      />

      <section className="flex-1 p-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#B58A45]">
            MesaLink Print Bridge
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-[-0.05em]">
            Impressão automática
          </h1>

          <div className="mt-6 flex flex-wrap gap-3">
  <a
    href="/downloads/MesaLink-Print-Bridge-Setup.exe"
    className="inline-flex items-center rounded-full bg-[#11100F] px-5 py-3 text-sm font-black text-white"
  >
    ⬇ Download para Windows
  </a>

  <a
    href="https://mesalink.pt"
    target="_blank"
    className="inline-flex items-center rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-black text-[#11100F]"
  >
    Guia de instalação
  </a>
</div>

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#7D746A]">
            Liga este restaurante a um computador Windows para imprimir tickets
            automaticamente em impressoras USB, Bluetooth, Rede ou PDF.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-6">
              <h2 className="text-xl font-black tracking-[-0.04em]">
                Ligar novo computador
              </h2>

              <form action={createBridgeDevice} className="mt-5 space-y-3">
                <input type="hidden" name="restaurantId" value={restaurant.id} />

                <input
                  name="deviceName"
                  defaultValue="PC Principal"
                  className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold outline-none"
                />

                <button className="h-12 w-full rounded-full bg-[#11100F] text-sm font-black text-white">
                  Gerar token do Bridge
                </button>
              </form>

              <p className="mt-4 text-xs font-bold leading-5 text-[#7D746A]">
                Depois copia o token para a aplicação{" "}
                <span className="text-[#11100F]">MesaLink-Print-Bridge.</span>
              </p>
            </div>

            <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-6">
              <h2 className="text-xl font-black tracking-[-0.04em]">
                Computadores ligados
              </h2>

              <div className="mt-5 space-y-3">
                {restaurant.printBridgeRestaurants.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#E1D0B8] bg-[#FFF9F0] p-5 text-sm font-bold text-[#7D746A]">
                    Ainda não há nenhum computador ligado.
                  </div>
                ) : (
                  restaurant.printBridgeRestaurants.map((link) => (
                    <div
                      key={link.id}
                      className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-[#11100F]">
                            {link.bridgeDevice.name}
                          </p>

                          <p className="mt-1 text-xs font-bold text-[#7D746A]">
                            Última ligação:{" "}
                            {link.bridgeDevice.lastSeenAt
                              ? new Date(
                                  link.bridgeDevice.lastSeenAt,
                                ).toLocaleString("pt-PT")
                              : "Nunca"}
                          </p>
                        </div>

                        <span className="rounded-full bg-[#FFF8EC] px-3 py-1 text-[10px] font-black uppercase text-[#9B6F3B]">
                          {link.bridgeDevice.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B58A45]">
                          Token
                        </p>
                        <code className="mt-2 block break-all text-xs font-bold text-[#11100F]">
                          {link.bridgeDevice.token}
                        </code>
                      </div>
                      <form action={deleteBridgeDevice} className="mt-3">
  <input type="hidden" name="restaurantId" value={restaurant.id} />
  <input
    type="hidden"
    name="bridgeDeviceId"
    value={link.bridgeDevice.id}
  />

  <button
    className="rounded-full border border-[#F0D4C8] bg-[#FFF7F3] px-4 py-2 text-xs font-black uppercase text-[#B4583C]"
  >
    Remover dispositivo
  </button>
</form>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[#E1D0B8] bg-white p-6">
  <h2 className="text-xl font-black tracking-[-0.04em]">
    Mapear impressoras
  </h2>

  <p className="mt-2 text-sm font-semibold leading-6 text-[#7D746A]">
    Escolhe que impressora Windows cada impressora MesaLink deve usar neste
    computador.
  </p>

  <div className="mt-5 space-y-4">
    {restaurant.printBridgeRestaurants.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-[#E1D0B8] bg-[#FFF9F0] p-5 text-sm font-bold text-[#7D746A]">
        Liga primeiro um computador para poder mapear impressoras.
      </div>
    ) : (
      restaurant.printBridgeRestaurants.map((link) => {
        const windowsPrinters = Array.isArray(
          link.bridgeDevice.windowsPrinters,
        )
          ? (link.bridgeDevice.windowsPrinters as string[])
          : [];

        return (
          <div
            key={link.id}
            className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4"
          >
            <div className="mb-4">
              <p className="font-black text-[#11100F]">
                {link.bridgeDevice.name}
              </p>
              <p className="mt-1 text-xs font-bold text-[#7D746A]">
                Impressoras Windows encontradas: {windowsPrinters.length}
              </p>
            </div>

            <div className="space-y-3">
              {restaurant.printers.map((printer) => {
                const mapping = link.bridgeDevice.mappings.find(
                  (item) => item.restaurantPrinterId === printer.id,
                );

                return (
                  <form
                    key={`${link.bridgeDevice.id}-${printer.id}`}
                    action={savePrinterMapping}
                    className="grid gap-3 rounded-2xl border border-[#E8E0D4] bg-white p-4 md:grid-cols-[1fr_1.4fr_auto]"
                  >
                    <input
                      type="hidden"
                      name="restaurantId"
                      value={restaurant.id}
                    />
                    <input
                      type="hidden"
                      name="bridgeDeviceId"
                      value={link.bridgeDevice.id}
                    />
                    <input
                      type="hidden"
                      name="restaurantPrinterId"
                      value={printer.id}
                    />

                    <div>
                      <p className="text-sm font-black text-[#11100F]">
                        {printer.name}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#7D746A]">
                        {printer.type} · {printer.method}
                      </p>
                    </div>

                    <select
                      name="windowsPrinterName"
                      defaultValue={mapping?.windowsPrinterName ?? ""}
                      className="h-11 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#11100F]"
                    >
                      <option value="">Sem associação</option>

                      {windowsPrinters.map((windowsPrinter) => (
                        <option key={windowsPrinter} value={windowsPrinter}>
                          {windowsPrinter}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
  <button className="h-11 rounded-full bg-[#11100F] px-5 text-xs font-black uppercase text-white">
    Guardar
  </button>

  <button
    formAction={testPrinter}
    className="h-11 rounded-full border border-[#E1D0B8] bg-white px-5 text-xs font-black uppercase text-[#11100F]"
  >
    Testar
  </button>
</div>
                  </form>
                );
              })}
            </div>
          </div>
        );
      })
    )}
  </div>
</div>
</div>
      </section>
    </main>
  );
}