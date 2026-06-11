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
      className="flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-8 text-base font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] transition hover:opacity-90"
    >
      Gerir subscrição
    </button>
  );
}