"use client";

export default function CopyButton({ text }: { text: string }) {
  async function copy() {
    await navigator.clipboard.writeText(text);
    alert("Link copiado!");
  }

  return (
    <button
      onClick={copy}
      className="bg-black text-white px-4 py-2 rounded"
    >
      Copiar link
    </button>
  );
}