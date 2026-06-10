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
      className="h-14 rounded-full bg-[#f0c36a] px-8 font-black text-black hover:bg-[#ffd982]"
    >
      Gerir subscrição
    </button>
  );
}