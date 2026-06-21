"use client";

import { useEffect, useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";

export function ImageUploadField({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
}) {
  const [canShowPreview, setCanShowPreview] = useState(
    Boolean(value?.startsWith("http")),
  );

  useEffect(() => {
    setCanShowPreview(Boolean(value?.startsWith("http")));
  }, [value]);

  return (
    <div className="space-y-3">
      {value?.startsWith("http") && canShowPreview && (
        <div className="relative overflow-hidden rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] shadow-[0_12px_34px_rgba(80,55,30,0.045)]">
          <img
            src={value}
            alt="Imagem carregada"
            onError={() => setCanShowPreview(false)}
            className={compact ? "h-28 w-full object-cover" : "h-48 w-full object-cover"}
          />

          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-3 rounded-full bg-[#16120E] px-3 py-1 text-xs font-semibold text-white shadow-lg"
          >
            Remover
          </button>
        </div>
      )}

      <UploadDropzone
        endpoint="websiteImage"
        appearance={{
          container: compact
            ? "border border-dashed border-[#D6C3A5] rounded-[24px] bg-[#FFF9F0] p-4 min-h-[132px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            : "border border-dashed border-[#D6C3A5] rounded-[28px] bg-[#FFF9F0] p-6 min-h-[210px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
          uploadIcon: "text-[#C8A56A]",
          label: "text-[#16120E] font-semibold text-sm text-center",
          allowedContent: "text-[#9B8F82] text-xs text-center",
          button:
            "bg-[#16120E] text-white font-semibold shadow-lg rounded-full px-5 py-2 hover:bg-[#2A2118] [color:#fff!important]",
        }}
        content={{
          label() {
            return compact
              ? "Arrastar foto"
              : "Arrasta uma imagem ou clica para escolher";
          },
          allowedContent() {
            return compact ? "PNG, JPG ou WEBP" : "PNG, JPG ou WEBP até 8MB";
          },
          button() {
            return compact ? "Escolher" : "Escolher imagem";
          },
        }}
        onClientUploadComplete={(res) => {
          if (res?.[0]?.ufsUrl) {
            onChange(res[0].ufsUrl);
            setCanShowPreview(true);
          }
        }}
      />
    </div>
  );
}