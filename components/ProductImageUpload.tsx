"use client";

import { UploadButton } from "@/lib/uploadthing";

type ProductImageUploadProps = {
  inputName?: string;
};

export default function ProductImageUpload({
  inputName = "imageUrl",
}: ProductImageUploadProps) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-3">
      <input type="hidden" name={inputName} id={inputName} />

      <UploadButton
        endpoint="productImage"
        onClientUploadComplete={(res) => {
          const url = res?.[0]?.ufsUrl || res?.[0]?.url;

          const input = document.getElementById(inputName) as HTMLInputElement;

          if (input && url) {
            input.value = url;
          }
        }}
        onUploadError={(error: Error) => {
          alert(`Erro no upload: ${error.message}`);
        }}
      />

      <p className="mt-2 text-xs font-bold text-slate-500">
        Faça upload da imagem do produto.
      </p>
    </div>
  );
}