import { redirect } from "next/navigation";

export default async function NoShowProtectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ result?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  redirect(`/restaurants/${id}/experiences${query.result ? `?result=${encodeURIComponent(query.result)}` : ""}#protecao-no-show`);
}
