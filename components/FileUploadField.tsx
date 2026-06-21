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
        <div className="flex items-center justify-between gap-4 rounded-[24px] border border-[#E1D0B8] bg-white p-4 shadow-[0_12px_34px_rgba(80,55,30,0.045)]">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#16120E]">
              Menu PDF carregado
            </p>

            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-xs font-semibold text-[#9B6F3B] underline"
            >
              Abrir PDF
            </a>
          </div>

          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-4 py-2 text-xs font-semibold text-[#A14E36]"
          >
            Remover
          </button>
        </div>
      )}

      <UploadDropzone
        endpoint="websiteMenuPdf"
        appearance={{
          container:
            "border border-dashed border-[#D6C3A5] rounded-[28px] bg-[#FFF9F0] p-6 min-h-[190px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
          uploadIcon: "text-[#C8A56A]",
          label: "text-[#16120E] font-semibold text-sm text-center",
          allowedContent: "text-[#9B8F82] text-xs text-center",
          button:
            "bg-[#16120E] text-white font-semibold rounded-full px-5 py-2 hover:bg-[#2A2118] [color:#fff!important]",
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