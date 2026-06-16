"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-black px-5 py-3 text-sm font-black text-white"
    >
      Imprimir
    </button>
  );
}