import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Acesso privado",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default function BackofficeAccessLayout({ children }: { children: ReactNode }) {
  return children;
}
