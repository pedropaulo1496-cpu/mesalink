import { redirect } from "next/navigation";

export default async function RemovedRestaurantBenefitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/restaurants/${id}/partner-network`);
}
