"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";
import { InteractiveUploadSurface } from "@/components/InteractiveUploadSurface";

type ProductImageUploadProps = {
  inputName?: string;
};

export default function ProductImageUpload({ inputName = "imageUrl" }: ProductImageUploadProps) {
  const t = useTranslations("dashboardMenu");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function clearImage() {
    const input = document.getElementById(inputName) as HTMLInputElement | null;
    if (input) input.value = "";
    setUploadedUrl("");
  }

  return (
    <div className="space-y-3 rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <input type="hidden" name={inputName} id={inputName} />

      {uploadedUrl && (
        <div className="flex items-center gap-3 rounded-[18px] border border-[#B8D7B9] bg-[#EFF9EF] p-3">
          <img src={uploadedUrl} alt="Fotografia do produto" className="h-16 w-16 rounded-[13px] object-cover" />
          <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-xs font-black text-[#3F6A4D]"><CheckCircle2 size={14} /> Fotografia pronta</p><p className="mt-1 text-[11px] text-[#64816B]">Será guardada com o produto.</p></div>
          <button type="button" onClick={clearImage} className="rounded-full border border-[#A8C9AA] px-3 py-1.5 text-[10px] font-bold text-[#3F6A4D]">Remover</button>
        </div>
      )}

      <InteractiveUploadSurface label="Carregar fotografia do produto" uploading={uploading} progress={progress}>
        <UploadDropzone
          endpoint="productImage"
          appearance={{
            container: "min-h-[150px] rounded-[22px] border border-dashed border-[#D6C3A5] bg-white p-4",
            uploadIcon: "text-[#C8A56A]",
            label: "text-[#16120E] font-semibold text-sm text-center",
            allowedContent: "text-[#9B8F82] text-xs text-center",
            button: "hidden",
          }}
          content={{ label: uploadedUrl ? "Arrasta outra fotografia para substituir" : "Arrasta a fotografia do produto para aqui", allowedContent: "O upload começa logo · ou toca na caixa · até 8MB" }}
          onUploadBegin={() => { setUploading(true); setProgress(4); setError(""); }}
          onUploadProgress={setProgress}
          onClientUploadComplete={(res) => {
            const url = res?.[0]?.ufsUrl || res?.[0]?.url;
            const input = document.getElementById(inputName) as HTMLInputElement | null;
            setUploading(false);
            setProgress(100);
            if (input && url) {
              input.value = url;
              setUploadedUrl(url);
            }
          }}
          onUploadError={(uploadError: Error) => {
            setUploading(false);
            setProgress(0);
            setError(t("imageUpload.uploadError", { message: uploadError.message }));
          }}
        />
      </InteractiveUploadSurface>
      {error && <p className="rounded-xl bg-[#FFF0EA] px-3 py-2 text-xs font-semibold text-[#A14E36]">{error}</p>}
      <p className="text-xs font-semibold text-[#6B6258]">{t("imageUpload.hint")}</p>
    </div>
  );
}
