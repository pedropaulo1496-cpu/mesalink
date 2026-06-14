"use client";

import Image from "next/image";
import { UploadDropzone } from "@/lib/uploadthing";

type ImageUploadFieldProps = {
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
};

export function ImageUploadField({
  value,
  onChange,
  compact = false,
}: ImageUploadFieldProps) {
  const hasImage = value?.startsWith("http");

  return (
    <div className="space-y-3">
      {hasImage && (
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <Image
            src={value}
            alt="Imagem carregada"
            width={900}
            height={600}
            className={compact ? "h-24 w-full object-cover" : "h-36 w-full object-cover"}
          />

          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-black text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
          >
            Remover
          </button>
        </div>
      )}

      <UploadDropzone
        endpoint="websiteImage"
        appearance={{
          container: compact
            ? "border border-white/10 rounded-2xl bg-black/20 p-4 min-h-[120px]"
            : "border border-white/10 rounded-3xl bg-black/20 p-6 min-h-[160px]",
          uploadIcon: "text-white/70",
          label: "text-white font-bold text-sm",
          allowedContent: "text-white/40 text-xs",
          button:
            "bg-white text-black font-black rounded-full px-5 py-2.5 hover:bg-zinc-200",
        }}
        content={{
          label() {
            return "Arrasta uma imagem ou clica para escolher";
          },
          allowedContent() {
            return "PNG, JPG ou WEBP até 8MB";
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
