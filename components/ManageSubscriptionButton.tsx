"use client";

export default function ManageSubscriptionButton() {
  async function openPortal() {
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <button
      onClick={openPortal}
      className="flex h-14 w-full items-center justify-center rounded-full bg-[#17130F] px-8 text-base font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.18)] transition hover:bg-[#2A2118]"
    >
      Gerir subscrição →
    </button>
  );
}
