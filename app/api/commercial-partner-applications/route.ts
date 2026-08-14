import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { calculateCommercialPartnerScore, commercialPartnerScoreLabel } from "@/lib/commercial-partner-score";

const resend = new Resend(process.env.RESEND_API_KEY);
const NETWORK_VALUES = new Set(["NONE", "SMALL", "MEDIUM", "LARGE"]);
const AVAILABILITY_VALUES = new Set(["LT_5", "H5_10", "H10_20", "H20_PLUS"]);

export async function POST(request: Request) {
  try {
    const input = await request.json();
    if (clean(input.website, 100)) return NextResponse.json({ success: true });

    const fullName = clean(input.fullName, 100);
    const email = clean(input.email, 200).toLowerCase();
    const phone = clean(input.phone, 40) || null;
    const country = clean(input.country, 100);
    const city = clean(input.city, 100) || null;
    const markets = list(input.markets, 10);
    const languages = list(input.languages, 10);
    const linkedinUrl = optionalPublicUrl(input.linkedinUrl);
    const cvUrl = uploadThingPdfUrl(input.cvUrl);
    const salesYears = wholeNumber(input.salesYears, 0, 40);
    const hospitalityYears = wholeNumber(input.hospitalityYears, 0, 40);
    const networkSize = clean(input.networkSize, 20);
    const weeklyAvailability = clean(input.weeklyAvailability, 20);
    const motivation = clean(input.motivation, 1600);
    const source = clean(input.source, 80) || "MESALINK_SITE";

    if (!fullName || !country || !isValidEmail(email) || !cvUrl || markets.length === 0 || languages.length === 0 || motivation.length < 80) {
      return NextResponse.json({ error: "Please complete every required field and upload a valid PDF CV." }, { status: 400 });
    }
    if (!NETWORK_VALUES.has(networkSize) || !AVAILABILITY_VALUES.has(weeklyAvailability)) {
      return NextResponse.json({ error: "Please select valid experience and availability options." }, { status: 400 });
    }
    if (input.consent !== true) return NextResponse.json({ error: "Privacy consent is required." }, { status: 400 });

    const hasSaasExperience = input.hasSaasExperience === true;
    const hasCommissionExperience = input.hasCommissionExperience === true;
    const scored = calculateCommercialPartnerScore({
      salesYears,
      hospitalityYears,
      hasSaasExperience,
      hasCommissionExperience,
      languages,
      markets,
      networkSize: networkSize as "NONE" | "SMALL" | "MEDIUM" | "LARGE",
      weeklyAvailability: weeklyAvailability as "LT_5" | "H5_10" | "H10_20" | "H20_PLUS",
    });

    const application = await prisma.commercialPartnerApplication.upsert({
      where: { email },
      create: {
        fullName, email, phone, country, city, markets, languages, linkedinUrl, cvUrl,
        salesYears, hospitalityYears, hasSaasExperience, hasCommissionExperience,
        networkSize, weeklyAvailability, motivation, score: scored.score,
        scoreBreakdown: scored.breakdown as unknown as Prisma.InputJsonValue,
        source, consentAt: new Date(),
      },
      update: {
        fullName, phone, country, city, markets, languages, linkedinUrl, cvUrl,
        salesYears, hospitalityYears, hasSaasExperience, hasCommissionExperience,
        networkSize, weeklyAvailability, motivation, score: scored.score,
        scoreBreakdown: scored.breakdown as unknown as Prisma.InputJsonValue,
        source, consentAt: new Date(),
      },
    });

    if (process.env.RESEND_API_KEY) {
      const hqUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/$/, "")}/backoffice/candidates`;
      await Promise.allSettled([
        resend.emails.send({
          from: "MesaLink <noreply@mesalink.pt>", to: email,
          subject: "We received your MesaLink commercial partner application",
          html: candidateEmail(fullName),
        }),
        resend.emails.send({
          from: "MesaLink Recruitment <noreply@mesalink.pt>", to: "info@mesalink.pt",
          subject: `New commercial partner · ${country} · ${scored.score}/100`,
          html: adminEmail({ fullName, email, country, city, score: scored.score, cvUrl, hqUrl }),
        }),
      ]);
    }

    return NextResponse.json({ success: true, id: application.id }, { status: 201 });
  } catch (error) {
    console.error("Commercial partner application failed", error);
    return NextResponse.json({ error: "We could not submit your application. Please try again." }, { status: 500 });
  }
}

function clean(value: unknown, max: number) { return String(value || "").trim().slice(0, max); }
function list(value: unknown, max: number) { return [...new Set(String(value || "").split(/[,;\n]/).map((item) => item.trim()).filter(Boolean))].slice(0, max); }
function wholeNumber(value: unknown, min: number, max: number) { const parsed = Number(value); if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error("Invalid number"); return parsed; }
function optionalPublicUrl(value: unknown) { const cleanValue = clean(value, 500); if (!cleanValue) return null; const parsed = new URL(cleanValue); if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Invalid URL"); return parsed.toString(); }
function uploadThingPdfUrl(value: unknown) { const cleanValue = clean(value, 1000); if (!cleanValue) return null; const parsed = new URL(cleanValue); const validHost = parsed.hostname === "utfs.io" || parsed.hostname === "ufs.sh" || parsed.hostname.endsWith(".ufs.sh"); if (parsed.protocol !== "https:" || !validHost) throw new Error("Invalid CV URL"); return parsed.toString(); }
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!); }

function candidateEmail(name: string) {
  return `<div style="font-family:Arial,sans-serif;background:#F3EDE4;padding:30px 12px;color:#17130F"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #DCC9AA;border-radius:26px;padding:32px"><p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:800">MesaLink global partners</p><h1 style="font-size:30px;line-height:1.1">Thank you, ${escapeHtml(name)}.</h1><p style="font-size:15px;line-height:1.7;color:#665C51">Your application has been received. A member of our team will review your commercial experience, market knowledge and application personally.</p><p style="font-size:13px;line-height:1.6;color:#8B7E70">If your profile matches a market we are developing, we will contact you using this email address. MesaLink never charges an application fee.</p></div></div>`;
}

function adminEmail(input: { fullName: string; email: string; country: string; city: string | null; score: number; cvUrl: string; hqUrl: string }) {
  return `<div style="font-family:Arial,sans-serif;background:#17130F;padding:30px 12px;color:#fff"><div style="max-width:620px;margin:auto;background:#251F19;border:1px solid #4B4035;border-radius:26px;padding:32px"><p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#D7B267;font-weight:800">New commercial application</p><h1 style="font-size:30px;line-height:1.1">${escapeHtml(input.fullName)}</h1><p style="font-size:15px;line-height:1.7;color:#D7CBBB">${escapeHtml(input.country)}${input.city ? ` · ${escapeHtml(input.city)}` : ""}<br>${escapeHtml(input.email)}</p><div style="margin:22px 0;background:#D7B267;color:#17130F;border-radius:18px;padding:18px"><strong style="font-size:28px">${input.score}/100</strong><br><span style="font-size:13px">${commercialPartnerScoreLabel(input.score)} · job-relevant prioritisation only</span></div><a href="${input.hqUrl}" style="display:inline-block;background:#fff;color:#17130F;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:800">Review in MesaLink HQ</a><a href="${input.cvUrl}" style="display:inline-block;margin-left:8px;color:#D7B267;padding:14px 10px;font-weight:800">Open CV</a></div></div>`;
}
