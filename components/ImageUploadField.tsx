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
  const [canShowPreview, setCanShowPreview] = useState(Boolean(value?.startsWith("http")));

  useEffect(() => {
    setCanShowPreview(Boolean(value?.startsWith("http")));
  }, [value]);

  return (
    <div className="space-y-3">
      {value?.startsWith("http") && canShowPreview && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <img
            src={value}
            alt="Imagem carregada"
            onError={() => setCanShowPreview(false)}
            className={compact ? "h-28 w-full object-cover" : "h-48 w-full object-cover"}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/75 px-3 py-1 text-xs font-black text-white backdrop-blur"
          >
            Remover
          </button>
        </div>
      )}

      <UploadDropzone
        endpoint="websiteImage"
        appearance={{
          container: compact
            ? "border border-white/10 rounded-2xl bg-black/20 p-4 min-h-[132px]"
            : "border border-white/10 rounded-3xl bg-black/20 p-6 min-h-[210px]",
          uploadIcon: "text-white/70",
          label: "text-white font-bold text-sm text-center",
          allowedContent: "text-white/35 text-xs text-center",
          button:
            "bg-white text-black font-black shadow-lg rounded-full px-5 py-2 hover:bg-zinc-200 [color:#000!important]",
        }}
        content={{
          label() {
            return compact ? "Arrastar foto" : "Arrasta uma imagem ou clica para escolher";
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
