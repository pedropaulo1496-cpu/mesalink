import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  websiteImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl };
  }),

  websiteMenuPdf: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl };
  }),

  partnerInvoicePdf: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  }).middleware(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) throw new UploadThingError("Não autenticado.");
    return { email: session.user.email };
  }).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl };
  }),

  commercialPartnerCv: f({
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl };
  }),

  productImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
