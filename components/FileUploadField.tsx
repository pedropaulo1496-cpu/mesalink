"use client";

import { UploadDropzone } from "@/lib/uploadthing";

export function FileUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="space-y-3">
      {value?.startsWith("http") && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="min-w-0">
            <p className="text-sm font-black text-white">Menu PDF carregado</p>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-xs font-semibold text-white/45 underline"
            >
              Abrir PDF
            </a>
          </div>

          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-black"
          >
            Remover
          </button>
        </div>
      )}

      <UploadDropzone
        endpoint="websiteMenuPdf"
        appearance={{
          container: "border border-white/10 rounded-3xl bg-black/20 p-6 min-h-[190px]",
          uploadIcon: "text-white/70",
          label: "text-white font-bold text-sm text-center",
          allowedContent: "text-white/35 text-xs text-center",
          button:
            "bg-white text-black font-black rounded-full px-5 py-2 hover:bg-zinc-200 [color:#000!important]",
        }}
        content={{
          label() {
            return "Arrasta o menu em PDF ou clica para escolher";
          },
          allowedContent() {
            return "PDF até 16MB";
          },
          button() {
            return "Escolher PDF";
          },
        }}
        onClientUploadComplete={(res) => {
          if (res?.[0]?.ufsUrl) onChange(res[0].ufsUrl);
        }}
      />
    </div>
  );
}
