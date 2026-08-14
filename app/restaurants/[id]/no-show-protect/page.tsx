import RevenuePage from "../revenue/page";

export default function NoShowProtectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ result?: string }> }) {
  return RevenuePage({
    params,
    searchParams: searchParams.then((query) => ({ ...query, tab: "protect", standalone: "1" })),
  });
}
