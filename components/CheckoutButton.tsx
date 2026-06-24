"use client";

type CheckoutButtonProps = {
  product: "ESSENTIALS" | "GROWTH" | string;
  label?: string;
  billing?: "MONTHLY" | "YEARLY";
  variant?: "dark" | "gold" | "outline" | "goldOutline";
};

export default function CheckoutButton({
  product,
  label = "Escolher plano →",
  billing = "MONTHLY",
  variant = "dark",
}: CheckoutButtonProps) {
  async function startCheckout() {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ product, billing }),
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    alert(data.error || "Erro ao criar checkout.");
  }

  const className =
    variant === "gold"
      ? "flex h-14 w-full items-center justify-center rounded-full bg-[#D8C5A5] px-5 text-sm font-semibold text-[#17130F] shadow-[0_18px_50px_rgba(216,197,165,0.18)] transition hover:bg-[#E8D6B8]"
      : variant === "goldOutline"
        ? "flex h-14 w-full items-center justify-center rounded-full border border-[#D8C5A5]/45 bg-white/[0.06] px-5 text-sm font-semibold text-[#D8C5A5] transition hover:bg-white/[0.10]"
        : variant === "outline"
          ? "flex h-14 w-full items-center justify-center rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-5 text-sm font-semibold text-[#9B6F3B] transition hover:bg-white"
          : "flex h-14 w-full items-center justify-center rounded-full bg-[#17130F] px-5 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.18)] transition hover:bg-[#2A2118]";

  return (
    <button type="button" onClick={startCheckout} className={className}>
      {label}
    </button>
  );
}
