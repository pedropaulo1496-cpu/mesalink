import { redirect } from "next/navigation";

export default async function ReservationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/restaurants/${id}/calendar`);
}
