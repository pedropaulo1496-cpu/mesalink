"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCodeImage({
  value,
  size = 160,
}: {
  value: string;
  size?: number;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    }).then(setSrc);
  }, [value, size]);

  if (!src) {
    return <div className="h-full w-full animate-pulse rounded-xl bg-slate-200" />;
  }

  return (
    <img
      src={src}
      alt="QR Code"
      className="h-full w-full object-contain"
    />
  );
}