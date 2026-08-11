import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  applicationName: "MesaLink Partners",
  manifest: "/partners/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MesaLink Partners",
    statusBarStyle: "black-translucent",
  },
};

export default function PartnersLayout({ children }: { children: ReactNode }) {
  return children;
}
