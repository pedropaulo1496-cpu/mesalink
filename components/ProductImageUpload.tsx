"use client";

import { UploadButton } from "@/lib/uploadthing";

type ProductImageUploadProps = {
  inputName?: string;
};

export default function ProductImageUpload({
  inputName = "imageUrl",
}: ProductImageUploadProps) {
  return (
    <div className="rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <input type="hidden" name={inputName} id={inputName} />

      <UploadButton
        endpoint="productImage"
        appearance={{
          button:
            "bg-[#16120E] text-white font-semibold rounded-full px-5 py-2 hover:bg-[#2A2118] [color:#fff!important]",
          allowedContent: "text-[#9B8F82] text-xs",
        }}
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

      <p className="mt-3 text-xs font-semibold text-[#6B6258]">
        Faça upload da imagem do produto.
      </p>
    </div>
  );
}