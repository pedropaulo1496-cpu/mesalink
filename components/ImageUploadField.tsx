"use client";

import Image from "next/image";
import { UploadDropzone } from "@/lib/uploadthing";

export function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="space-y-3">
      {value?.startsWith("http") && (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <Image
            src={value}
            alt=""
            width={800}
            height={500}
            className="h-48 w-full object-cover"
          />
        </div>
      )}

      <UploadDropzone
        endpoint="websiteImage"
        appearance={{
          container: "border border-white/10 rounded-3xl bg-black/20 p-6",
          uploadIcon: "text-white",
          label: "text-white font-bold",
          allowedContent: "text-white/40",
        }}
        onClientUploadComplete={(res) => {
          if (res?.[0]?.ufsUrl) {
            onChange(res[0].ufsUrl);
          }
        }}
      />
    </div>
  );
}