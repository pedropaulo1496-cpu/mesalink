"use client";

export default function CopyButton({ text }: { text: string }) {
  async function copy() {
    await navigator.clipboard.writeText(text);
    alert("Link copiado!");
  }

  return (
    <button
      onClick={copy}
      className="
        h-12
        w-full
        rounded-2xl
        bg-gradient-to-r
        from-cyan-300
        via-blue-400
        to-violet-500
        px-5
        font-black
        text-black
        transition
        hover:opacity-90
        shadow-[0_0_30px_rgba(96,165,250,0.35)]
      "
    >
      Copiar link
    </button>
  );
}