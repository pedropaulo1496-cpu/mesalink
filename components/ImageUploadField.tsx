"use client";

import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";

export function ImageUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="space-y-3">
      {value && (
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

      <UploadButton
        endpoint="websiteImage"
        onClientUploadComplete={(res) => {
          if (res?.[0]?.ufsUrl) {
            onChange(res[0].ufsUrl);
          }
        }}
      />
    </div>
  );
}