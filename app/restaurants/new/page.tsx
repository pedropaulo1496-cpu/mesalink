import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

async function createRestaurant(formData: FormData) {
  "use server";

  const name = String(formData.get("name"));
  const slug = String(formData.get("slug"));
  const email = String(formData.get("email"));
  const phone = String(formData.get("phone"));
  const address = String(formData.get("address"));

  try {
    await prisma.restaurant.create({
      data: { name, slug, email, phone, address },
    });

    redirect("/");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      redirect("/restaurants/new?error=slug_taken");
    }

    throw err;
  }
}

export default function NewRestaurantPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-6">Criar Restaurante</h1>

        <form action={createRestaurant} className="space-y-4">
          <input name="name" placeholder="Nome" className="w-full border p-3 rounded" required />
          <input name="slug" placeholder="slug-exemplo" className="w-full border p-3 rounded" required />
          <input name="email" placeholder="Email" className="w-full border p-3 rounded" />
          <input name="phone" placeholder="Telefone" className="w-full border p-3 rounded" />
          <input name="address" placeholder="Morada" className="w-full border p-3 rounded" />

          <button className="w-full bg-black text-white p-3 rounded">
            Guardar
          </button>
        </form>
      </div>
    </main>
  );
}