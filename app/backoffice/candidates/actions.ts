"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertBackofficeAdmin } from "@/lib/staff-auth";

const STATUSES = new Set(["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "APPROVED", "REJECTED"]);

export async function updateCandidateReview(formData: FormData) {
  await assertBackofficeAdmin();
  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim().slice(0, 2000) || null;
  if (!id || !STATUSES.has(status)) throw new Error("Candidatura ou estado inválido.");

  await prisma.commercialPartnerApplication.update({
    where: { id },
    data: { status, adminNote, reviewedAt: new Date() },
  });
  revalidatePath("/backoffice/candidates");
  redirect("/backoffice/candidates?done=reviewed");
}
