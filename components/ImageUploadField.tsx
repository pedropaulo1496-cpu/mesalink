"use client";

import { useState } from "react";
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

  return (
    <div className="space-y-3">
      {value?.startsWith("http") && brokenPreviewUrl !== value && (
        <div className="relative overflow-hidden rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] shadow-[0_12px_34px_rgba(80,55,30,0.045)]">
          <img
            src={value}
            alt="Imagem carregada"
            onError={() => setBrokenPreviewUrl(value)}
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

      <InteractiveUploadSurface label="Carregar fotografia" uploading={uploading} progress={progress}>
        <UploadDropzone
          endpoint="websiteImage"
          appearance={{
            container: compact
              ? "border border-dashed border-[#D6C3A5] rounded-[24px] bg-[#FFF9F0] p-4 min-h-[132px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
              : "border border-dashed border-[#D6C3A5] rounded-[28px] bg-[#FFF9F0] p-6 min-h-[210px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
            uploadIcon: "text-[#C8A56A]",
            label: "text-[#16120E] font-semibold text-sm text-center",
            allowedContent: "text-[#9B8F82] text-xs text-center",
            button: "hidden",
          }}
          content={{
            label: compact ? "Larga a fotografia aqui" : "Arrasta a fotografia diretamente para aqui",
            allowedContent: compact ? "Ou toca na caixa · PNG, JPG ou WEBP" : "O upload começa logo · ou toca na caixa · até 8MB",
          }}
          onUploadBegin={() => { setUploading(true); setProgress(4); setError(""); }}
          onUploadProgress={setProgress}
          onClientUploadComplete={(res) => {
            setUploading(false);
            setProgress(100);
            if (res?.[0]?.ufsUrl) {
              onChange(res[0].ufsUrl);
              setBrokenPreviewUrl("");
            }
          }}
          onUploadError={(uploadError) => { setUploading(false); setProgress(0); setError(uploadError.message || "Não foi possível carregar a fotografia."); }}
        />
      </InteractiveUploadSurface>
      {error && <p className="rounded-xl bg-[#FFF0EA] px-3 py-2 text-xs font-semibold text-[#A14E36]">{error}</p>}
    </div>
  );
}
