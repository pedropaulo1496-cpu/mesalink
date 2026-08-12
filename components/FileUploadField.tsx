"use client";

import { useState } from "react";
import { UploadDropzone } from "@/lib/uploadthing";
import { InteractiveUploadSurface } from "@/components/InteractiveUploadSurface";

export function FileUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

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

      <InteractiveUploadSurface label="Carregar PDF" uploading={uploading} progress={progress}>
        <UploadDropzone
          endpoint="websiteMenuPdf"
          appearance={{
            container: "border border-dashed border-[#D6C3A5] rounded-[28px] bg-[#FFF9F0] p-6 min-h-[190px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
            uploadIcon: "text-[#C8A56A]",
            label: "text-[#16120E] font-semibold text-sm text-center",
            allowedContent: "text-[#9B8F82] text-xs text-center",
            button: "hidden",
          }}
          content={{ label: "Arrasta o PDF diretamente para aqui", allowedContent: "O upload começa logo · ou toca na caixa · até 16MB" }}
          onUploadBegin={() => { setUploading(true); setProgress(4); setError(""); }}
          onUploadProgress={setProgress}
          onClientUploadComplete={(res) => {
            setUploading(false);
            setProgress(100);
            if (res?.[0]?.ufsUrl) onChange(res[0].ufsUrl);
          }}
          onUploadError={(uploadError) => { setUploading(false); setProgress(0); setError(uploadError.message || "Não foi possível carregar o PDF."); }}
        />
      </InteractiveUploadSurface>
      {error && <p className="rounded-xl bg-[#FFF0EA] px-3 py-2 text-xs font-semibold text-[#A14E36]">{error}</p>}
    </div>
  );
}
