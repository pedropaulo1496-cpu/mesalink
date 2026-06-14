"use client";

import { UploadDropzone } from "@/lib/uploadthing";

type FileUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
};

export function FileUploadField({ value, onChange }: FileUploadFieldProps) {
  const hasFile = value?.startsWith("http");

  return (
    <div className="space-y-3">
      {hasFile && (
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-white">Menu PDF carregado</p>
            <p className="mt-1 max-w-md truncate text-xs text-white/40">{value}</p>
          </div>

          <div className="flex gap-2">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-black text-white hover:bg-white/10"
            >
              Ver PDF
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full bg-white px-4 py-2 text-xs font-black text-black hover:bg-zinc-200"
            >
              Remover
            </button>
          </div>
        </div>
      )}

      <UploadDropzone
        endpoint="websiteMenuPdf"
        appearance={{
          container: "border border-white/10 rounded-3xl bg-black/20 p-6 min-h-[150px]",
          uploadIcon: "text-white/70",
          label: "text-white font-bold text-sm",
          allowedContent: "text-white/40 text-xs",
          button:
            "bg-white text-black font-black rounded-full px-5 py-2.5 hover:bg-zinc-200",
        }}
        content={{
          label() {
            return "Arrasta o menu em PDF ou clica para escolher";
          },
          allowedContent() {
            return "PDF até 16MB";
          },
        }}
        onClientUploadComplete={(res) => {
          const url = res?.[0]?.ufsUrl || res?.[0]?.url;
          if (url) onChange(url);
        }}
      />
    </div>
  );
}
