"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadDropzone } from "@/lib/uploadthing";
import { InteractiveUploadSurface } from "@/components/InteractiveUploadSurface";

export function ImageUploadField({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
}) {
  const [brokenPreviewUrl, setBrokenPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const hasPreview = value?.startsWith("http") && brokenPreviewUrl !== value;

  const uploadAppearance = {
    container: hasPreview
      ? "absolute inset-0 z-10 min-h-0 cursor-pointer border-0 bg-transparent p-0 opacity-0"
      : compact
        ? "border border-dashed border-[#D6C3A5] rounded-[18px] bg-[#FFF9F0] px-3 py-2 min-h-[82px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
        : "border border-dashed border-[#D6C3A5] rounded-[20px] bg-[#FFF9F0] px-4 py-3 min-h-[112px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    uploadIcon: hasPreview ? "hidden" : "h-6 w-6 text-[#C8A56A]",
    label: hasPreview ? "hidden" : "text-[#16120E] font-semibold text-xs text-center",
    allowedContent: hasPreview ? "hidden" : "text-[#9B8F82] text-[10px] text-center",
    button: "hidden",
  };

  const uploadContent = {
    label: hasPreview ? "Substituir fotografia" : "Larga ou toca para adicionar",
    allowedContent: hasPreview ? "" : "PNG, JPG ou WEBP · até 8 MB",
  };

  const uploadCallbacks = {
    onUploadBegin: () => { setUploading(true); setProgress(4); setError(""); },
    onUploadProgress: setProgress,
    onClientUploadComplete: (res: { ufsUrl?: string }[] | undefined) => {
      setUploading(false);
      setProgress(100);
      if (res?.[0]?.ufsUrl) {
        onChange(res[0].ufsUrl);
        setBrokenPreviewUrl("");
      }
    },
    onUploadError: (uploadError: Error) => {
      setUploading(false);
      setProgress(0);
      setError(uploadError.message || "Não foi possível carregar a fotografia.");
    },
  };

  return (
    <div className="space-y-2">
      {hasPreview ? (
        <InteractiveUploadSurface label="Substituir fotografia" uploading={uploading} progress={progress}>
          <div className="group relative overflow-hidden rounded-[18px] border border-[#E1D0B8] bg-[#FFF9F0] shadow-[0_8px_24px_rgba(80,55,30,0.04)]">
            <Image
              src={value}
              alt="Imagem carregada"
              width={1200}
              height={600}
              unoptimized
              onError={() => setBrokenPreviewUrl(value)}
              className={compact ? "h-[92px] w-full object-cover" : "h-32 w-full object-cover"}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/65 to-transparent px-3 pb-2 pt-7 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
              Tocar ou largar para substituir
            </div>
            <UploadDropzone endpoint="websiteImage" appearance={uploadAppearance} content={uploadContent} {...uploadCallbacks} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-2 z-30 rounded-full border border-white/25 bg-[#16120E]/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm"
            >
              Remover
            </button>
          </div>
        </InteractiveUploadSurface>
      ) : (
        <InteractiveUploadSurface label="Carregar fotografia" uploading={uploading} progress={progress}>
          <UploadDropzone endpoint="websiteImage" appearance={uploadAppearance} content={uploadContent} {...uploadCallbacks} />
        </InteractiveUploadSurface>
      )}
      {error && <p className="rounded-xl bg-[#FFF0EA] px-3 py-2 text-xs font-semibold text-[#A14E36]">{error}</p>}
    </div>
  );
}
