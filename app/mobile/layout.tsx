import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "https://www.mesalink.pt" },
  robots: { index: false, follow: true },
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
