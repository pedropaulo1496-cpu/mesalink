"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, FileText, Loader2, Send, UploadCloud, X } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";
import { InteractiveUploadSurface } from "@/components/InteractiveUploadSurface";

const fieldClass = "h-12 w-full rounded-2xl border border-[#DFCEB6] bg-[#FFFDF9] px-4 text-sm text-[#17130F] outline-none transition placeholder:text-[#A39789] focus:border-[#B88645] focus:ring-2 focus:ring-[#D7B267]/20";
const labelClass = "mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-[#805D2E]";

export default function CommercialPartnerApplicationForm() {
  const [cvUrl, setCvUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!cvUrl) {
      setError("Please upload your CV in PDF format.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/commercial-partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          country: formData.get("country"),
          city: formData.get("city"),
          markets: formData.get("markets"),
          languages: formData.get("languages"),
          linkedinUrl: formData.get("linkedinUrl"),
          cvUrl,
          salesYears: formData.get("salesYears"),
          hospitalityYears: formData.get("hospitalityYears"),
          hasSaasExperience: formData.get("hasSaasExperience") === "on",
          hasCommissionExperience: formData.get("hasCommissionExperience") === "on",
          networkSize: formData.get("networkSize"),
          weeklyAvailability: formData.get("weeklyAvailability"),
          motivation: formData.get("motivation"),
          consent: formData.get("consent") === "on",
          website: formData.get("website"),
          source: new URLSearchParams(window.location.search).get("source") || "MESALINK_SITE",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "We could not submit your application.");
      setSent(true);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[30px] border border-[#B9D5B9] bg-[#F1FAF0] p-7 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#DDEEDC] text-[#35603A]"><CheckCircle2 size={26} /></span>
        <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">Application received.</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#5F695E]">Our team will review your experience personally. If there is a strong fit for your market, we will contact you at the email provided.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[30px] border border-[#DCC9AA] bg-white p-5 shadow-[0_24px_70px_rgba(70,48,25,0.08)] sm:p-8">
      <div className="flex flex-col gap-3 border-b border-[#EEE2D1] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Apply worldwide</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Tell us what you can build.</h2>
        </div>
        <p className="max-w-xs text-xs leading-5 text-[#776B5E]">About 5 minutes · one application per person · reviewed by the MesaLink team.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name *"><input name="fullName" autoComplete="name" className={fieldClass} required maxLength={100} /></Field>
        <Field label="Email *"><input name="email" type="email" autoComplete="email" className={fieldClass} required maxLength={200} /></Field>
        <Field label="WhatsApp / phone"><input name="phone" type="tel" autoComplete="tel" placeholder="Include country code" className={fieldClass} maxLength={40} /></Field>
        <Field label="Country *"><input name="country" autoComplete="country-name" placeholder="e.g. Portugal" className={fieldClass} required maxLength={100} /></Field>
        <Field label="City / region"><input name="city" autoComplete="address-level2" placeholder="e.g. Lisbon" className={fieldClass} maxLength={100} /></Field>
        <Field label="LinkedIn profile"><input name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/..." className={fieldClass} maxLength={500} /></Field>
        <Field label="Markets you can cover *"><input name="markets" placeholder="Portugal, Spain, Brazil" className={fieldClass} required maxLength={300} /></Field>
        <Field label="Languages *"><input name="languages" placeholder="Portuguese, English, Spanish" className={fieldClass} required maxLength={300} /></Field>
        <Field label="Years in sales *">
          <select name="salesYears" className={fieldClass} required defaultValue="">
            <option value="" disabled>Select</option><option value="0">No direct sales experience</option><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="4">4 years</option><option value="5">5+ years</option>
          </select>
        </Field>
        <Field label="Years in restaurants / hospitality *">
          <select name="hospitalityYears" className={fieldClass} required defaultValue="">
            <option value="" disabled>Select</option><option value="0">No direct experience</option><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="4">4 years</option><option value="5">5+ years</option>
          </select>
        </Field>
        <Field label="Restaurant decision-maker network *">
          <select name="networkSize" className={fieldClass} required defaultValue="">
            <option value="" disabled>Select</option><option value="NONE">I am starting to build it</option><option value="SMALL">1–10 relevant contacts</option><option value="MEDIUM">11–40 relevant contacts</option><option value="LARGE">40+ relevant contacts</option>
          </select>
        </Field>
        <Field label="Weekly availability *">
          <select name="weeklyAvailability" className={fieldClass} required defaultValue="">
            <option value="" disabled>Select</option><option value="LT_5">Less than 5 hours</option><option value="H5_10">5–10 hours</option><option value="H10_20">10–20 hours</option><option value="H20_PLUS">20+ hours</option>
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Check name="hasSaasExperience" text="I have sold SaaS or technology products." />
        <Check name="hasCommissionExperience" text="I have worked in a commission-based role." />
      </div>

      <div className="mt-5">
        <Field label="Why MesaLink and this market? *">
          <textarea name="motivation" rows={5} minLength={80} maxLength={1600} required placeholder="Tell us how you would reach restaurant owners, what you already know about the market, and why you would be effective." className="w-full resize-y rounded-2xl border border-[#DFCEB6] bg-[#FFFDF9] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#A39789] focus:border-[#B88645] focus:ring-2 focus:ring-[#D7B267]/20" />
        </Field>
      </div>

      <div className="mt-5">
        <span className={labelClass}>CV in PDF * </span>
        {cvUrl ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#BBD4BA] bg-[#F1FAF0] p-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#37613C]"><FileText size={19} /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-bold">CV uploaded</p><a href={cvUrl} target="_blank" rel="noreferrer" className="block truncate text-xs text-[#4D744F] underline">Open PDF</a></div>
            <button type="button" onClick={() => setCvUrl("")} className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#7B5C4E]" aria-label="Remove CV"><X size={16} /></button>
          </div>
        ) : (
          <InteractiveUploadSurface label="Upload CV in PDF" uploading={uploading} progress={uploadProgress}>
            <UploadDropzone
              endpoint="commercialPartnerCv"
              appearance={{
                container: "min-h-[145px] rounded-2xl border border-dashed border-[#CDB68F] bg-[#FFF9F0] p-5",
                uploadIcon: "text-[#B88645]",
                label: "text-[#17130F] text-sm font-bold",
                allowedContent: "text-[#8B7E70] text-xs",
                button: "hidden",
              }}
              content={{
                uploadIcon: <UploadCloud size={28} />,
                label: "Drop your CV here or tap to choose",
                allowedContent: "PDF only · maximum 8 MB · upload starts automatically",
              }}
              onUploadBegin={() => { setUploading(true); setUploadProgress(5); setUploadError(""); }}
              onUploadProgress={setUploadProgress}
              onClientUploadComplete={(files) => {
                setUploading(false);
                setUploadProgress(100);
                if (files?.[0]?.ufsUrl) setCvUrl(files[0].ufsUrl);
              }}
              onUploadError={(uploadIssue) => { setUploading(false); setUploadProgress(0); setUploadError(uploadIssue.message || "Upload failed."); }}
            />
          </InteractiveUploadSurface>
        )}
        {uploadError && <p className="mt-2 rounded-xl bg-[#FFF0EA] px-3 py-2 text-xs font-semibold text-[#A14E36]">{uploadError}</p>}
      </div>

      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F8F3EB] p-4 text-xs leading-5 text-[#665C51]">
        <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#17130F]" />
        <span>I agree that MesaLink may process my application data and CV to assess this commercial partnership. I understand that job-relevant answers help prioritise human review, but no application is automatically rejected. <a href="/privacy" target="_blank" className="font-bold text-[#805D2E] underline">Privacy policy</a>.</span>
      </label>

      {error && <p role="alert" className="mt-4 rounded-2xl border border-[#F0C3B3] bg-[#FFF0EA] px-4 py-3 text-sm font-semibold text-[#9B432E]">{error}</p>}
      <button disabled={submitting || uploading} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#17130F] px-6 text-sm font-black text-white shadow-[0_16px_36px_rgba(23,19,15,.18)] transition hover:bg-[#2A2118] disabled:cursor-not-allowed disabled:opacity-55">
        {submitting ? <><Loader2 size={17} className="animate-spin" /> Submitting application…</> : <><Send size={17} /> Submit application</>}
      </button>
      <p className="mt-3 text-center text-[11px] leading-4 text-[#948779]">Please do not include sensitive personal information that is not relevant to the role.</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className={labelClass}>{label}</span>{children}</label>;
}

function Check({ name, text }: { name: string; text: string }) {
  return <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#E5D6C0] bg-[#FFF9F0] px-4 py-3 text-sm font-semibold"><input name={name} type="checkbox" className="h-4 w-4 accent-[#17130F]" /><span>{text}</span></label>;
}
