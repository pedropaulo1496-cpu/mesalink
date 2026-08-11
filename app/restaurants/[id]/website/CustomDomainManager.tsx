"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Globe2,
  Link2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

export type PublicDomainOrder = {
  id: string;
  domain: string;
  kind: string;
  status: string;
  providerPriceCents: number;
  servicePercentBps: number;
  servicePercentCents: number;
  serviceFixedCents: number;
  stripeFeeBps: number;
  stripeFeeFixedCents: number;
  stripeFeeCents: number;
  totalCents: number;
  dnsRecords: Array<{ type?: string; name?: string; value?: string }>;
  failureReason: string | null;
  quoteExpiresAt: string;
  paidAt: string | null;
  purchasedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

type Quote = {
  domain: string;
  kind: "PURCHASE" | "CONNECT";
  renewalPrice: number | null;
  quoteExpiresAt: string;
  pricing: {
    providerPriceCents: number;
    servicePercentBps: number;
    servicePercentCents: number;
    serviceFixedCents: number;
    stripeFeeBps: number;
    stripeFeeFixedCents: number;
    stripeFeeCents: number;
    totalCents: number;
  };
};

const PROCESSING = new Set(["CHECKOUT_PENDING", "PAID", "PURCHASING", "PROVISIONING", "DNS_PENDING"]);

function money(cents: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function CustomDomainManager({
  restaurantId,
  restaurantName,
  email,
  phone,
  address,
  activeDomain,
  activeDomainVerified,
  initialOrder,
  serviceConfigured,
}: {
  restaurantId: string;
  restaurantName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  activeDomain: string | null;
  activeDomainVerified: boolean;
  initialOrder: PublicDomainOrder | null;
  serviceConfigured: boolean;
}) {
  const t = useTranslations("dashboardSettings.website.seo.domainManager");
  const [kind, setKind] = useState<"PURCHASE" | "CONNECT">("PURCHASE");
  const [domain, setDomain] = useState(activeDomain || "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState<"quote" | "checkout" | "refresh" | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [registrant, setRegistrant] = useState({
    firstName: "",
    lastName: "",
    email: email || "",
    phone: phone || "+351",
    companyName: restaurantName,
    address1: address || "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "PT",
  });

  const orderStatus = useMemo(() => {
    if (!order) return null;
    if (order.status === "ACTIVE") return { label: t("status.active"), tone: "green" };
    if (order.status === "DNS_PENDING") return { label: t("status.dns"), tone: "amber" };
    if (order.status === "REFUNDED") return { label: t("status.refunded"), tone: "red" };
    if (order.status === "FAILED") return { label: t("status.failed"), tone: "red" };
    if (order.status === "CANCELLED") return { label: t("status.cancelled"), tone: "red" };
    if (order.status === "DISPUTED") return { label: t("status.disputed"), tone: "red" };
    return { label: t("status.processing"), tone: "blue" };
  }, [order, t]);

  async function refreshStatus(silent = false) {
    if (!order?.id) return;
    if (!silent) setLoading("refresh");
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/domain/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("errors.status"));
      if (data.order) setOrder(data.order);
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : t("errors.status"));
    } finally {
      if (!silent) setLoading(null);
    }
  }

  useEffect(() => {
    if (!order || !PROCESSING.has(order.status)) return;
    const timer = window.setInterval(() => void refreshStatus(true), 6_000);
    return () => window.clearInterval(timer);
  // refreshStatus intentionally reads the current order id.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, order?.status]);

  function changeDomain(value: string) {
    setDomain(value.toLowerCase().replace(/\s/g, ""));
    setQuote(null);
    setError("");
  }

  async function requestQuote() {
    setLoading("quote");
    setError("");
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/domain/quote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain, kind }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("errors.quote"));
      setDomain(data.domain);
      setQuote(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("errors.quote"));
    } finally {
      setLoading(null);
    }
  }

  async function checkout() {
    if (!quote) return;
    setLoading("checkout");
    setError("");
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/domain/checkout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: quote.domain, kind: quote.kind, registrant }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("errors.checkout"));
      window.location.href = data.url;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("errors.checkout"));
      setLoading(null);
    }
  }

  async function copyRecord(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1_800);
  }

  return (
    <div className="space-y-4">
      {activeDomain && activeDomainVerified ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-700"><ShieldCheck size={21} /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{t("activeEyebrow")}</p>
                <a className="mt-1 block font-semibold text-[#16120E] underline-offset-4 hover:underline" href={`https://${activeDomain}`} target="_blank" rel="noreferrer">{activeDomain}</a>
              </div>
            </div>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">{t("status.active")}</span>
          </div>
        </div>
      ) : null}

      {order && orderStatus ? (
        <div className="rounded-[1.5rem] border border-[#E1D0B8] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">{t("latestOrder")}</p>
              <p className="mt-2 text-lg font-semibold text-[#16120E]">{order.domain}</p>
              <p className="mt-1 text-sm text-[#6B6258]">{order.kind === "PURCHASE" ? t("kinds.purchase") : t("kinds.connect")} · {money(order.totalCents)}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              orderStatus.tone === "green" ? "bg-emerald-100 text-emerald-700" :
              orderStatus.tone === "red" ? "bg-red-100 text-red-700" :
              orderStatus.tone === "amber" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"
            }`}>{orderStatus.label}</span>
          </div>

          {order.failureReason ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm leading-6 text-red-700">{order.failureReason}</p> : null}

          {order.status === "DNS_PENDING" && order.dnsRecords.length ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-[#16120E]">{t("dnsTitle")}</p>
              <p className="text-sm leading-6 text-[#6B6258]">{t("dnsText")}</p>
              {order.dnsRecords.map((record, index) => {
                const value = String(record.value || "");
                return (
                  <div key={`${record.type}-${index}`} className="grid gap-2 rounded-2xl bg-[#FFF9F0] p-3 sm:grid-cols-[70px_1fr_2fr_auto] sm:items-center">
                    <span className="text-xs font-bold text-[#9B6F3B]">{record.type}</span>
                    <span className="break-all text-sm font-semibold">{record.name}</span>
                    <span className="break-all text-sm text-[#6B6258]">{value}</span>
                    <button type="button" onClick={() => void copyRecord(value)} className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-[#E1D0B8] px-3 text-xs font-semibold">
                      {copied === value ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                      {copied === value ? t("copied") : t("copy")}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {PROCESSING.has(order.status) ? (
            <button type="button" onClick={() => void refreshStatus()} disabled={loading === "refresh"} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-[#E1D0B8] px-4 text-sm font-semibold disabled:opacity-60">
              {loading === "refresh" ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {t("refresh")}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EFE1CC] text-[#9B6F3B]"><Globe2 size={21} /></span>
          <div>
            <p className="font-semibold text-[#16120E]">{t("title")}</p>
            <p className="mt-1 text-sm leading-6 text-[#6B6258]">{t("description")}</p>
          </div>
        </div>

        {!serviceConfigured ? (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">{t("notConfigured")}</p>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5">
              <button type="button" onClick={() => { setKind("PURCHASE"); setQuote(null); setError(""); }} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${kind === "PURCHASE" ? "bg-[#16120E] text-white" : "text-[#6B6258]"}`}><ShoppingCart size={16} />{t("buyTab")}</button>
              <button type="button" onClick={() => { setKind("CONNECT"); setQuote(null); setError(""); }} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${kind === "CONNECT" ? "bg-[#16120E] text-white" : "text-[#6B6258]"}`}><Link2 size={16} />{t("connectTab")}</button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input value={domain} onChange={(event) => changeDomain(event.target.value)} placeholder="omeurestaurante.pt" className="input-premium h-12" />
              <button type="button" onClick={() => void requestQuote()} disabled={!domain || Boolean(loading)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white disabled:opacity-50">
                {loading === "quote" ? <LoaderCircle size={17} className="animate-spin" /> : <Globe2 size={17} />}
                {kind === "PURCHASE" ? t("checkAvailability") : t("calculateConnection")}
              </button>
            </div>

            {error ? <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

            {quote ? (
              <div className="mt-5 rounded-[1.4rem] border border-[#D8C29F] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{kind === "PURCHASE" ? t("available") : t("readyToConnect")}</p><p className="mt-1 text-lg font-semibold">{quote.domain}</p></div>
                  <CheckCircle2 className="text-emerald-600" size={24} />
                </div>
                <div className="mt-4 space-y-2 border-t border-[#EEE1CF] pt-4 text-sm">
                  <PriceRow label={kind === "PURCHASE" ? t("domainCost") : t("connectionCost")} value={money(quote.pricing.providerPriceCents)} />
                  <PriceRow label={t("servicePercent")} value={money(quote.pricing.servicePercentCents)} />
                  <PriceRow label={t("serviceFixed")} value={money(quote.pricing.serviceFixedCents)} />
                  <PriceRow label={t("stripeFee", { percent: quote.pricing.stripeFeeBps / 100 })} value={money(quote.pricing.stripeFeeCents)} />
                  <div className="flex items-center justify-between border-t border-[#EEE1CF] pt-3 text-base font-bold"><span>{t("total")}</span><span>{money(quote.pricing.totalCents)}</span></div>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#7B7065]">{t("taxNote")}</p>

                {kind === "PURCHASE" ? (
                  <div className="mt-5 border-t border-[#EEE1CF] pt-5">
                    <p className="font-semibold">{t("holderTitle")}</p>
                    <p className="mt-1 text-sm leading-6 text-[#6B6258]">{t("holderText")}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <RegistrantInput label={t("fields.firstName")} value={registrant.firstName} onChange={(value) => setRegistrant((current) => ({ ...current, firstName: value }))} />
                      <RegistrantInput label={t("fields.lastName")} value={registrant.lastName} onChange={(value) => setRegistrant((current) => ({ ...current, lastName: value }))} />
                      <RegistrantInput label={t("fields.email")} type="email" value={registrant.email} onChange={(value) => setRegistrant((current) => ({ ...current, email: value }))} />
                      <RegistrantInput label={t("fields.phone")} value={registrant.phone} onChange={(value) => setRegistrant((current) => ({ ...current, phone: value }))} placeholder="+351912345678" />
                      <RegistrantInput label={t("fields.company")} value={registrant.companyName} onChange={(value) => setRegistrant((current) => ({ ...current, companyName: value }))} />
                      <RegistrantInput label={t("fields.address")} value={registrant.address1} onChange={(value) => setRegistrant((current) => ({ ...current, address1: value }))} />
                      <RegistrantInput label={t("fields.city")} value={registrant.city} onChange={(value) => setRegistrant((current) => ({ ...current, city: value }))} />
                      <RegistrantInput label={t("fields.state")} value={registrant.state} onChange={(value) => setRegistrant((current) => ({ ...current, state: value }))} />
                      <RegistrantInput label={t("fields.zip")} value={registrant.zip} onChange={(value) => setRegistrant((current) => ({ ...current, zip: value }))} />
                      <RegistrantInput label={t("fields.country")} value={registrant.country} onChange={(value) => setRegistrant((current) => ({ ...current, country: value.toUpperCase().slice(0, 2) }))} placeholder="PT" />
                    </div>
                  </div>
                ) : null}

                <button type="button" onClick={() => void checkout()} disabled={loading === "checkout"} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white disabled:opacity-60">
                  {loading === "checkout" ? <LoaderCircle size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                  {kind === "PURCHASE" ? t("payAndRegister") : t("payAndConnect")}
                </button>
                {kind === "PURCHASE" ? <p className="mt-3 text-center text-xs leading-5 text-[#7B7065]">{t("renewalNote")}</p> : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 text-[#6B6258]"><span>{label}</span><span className="font-semibold text-[#16120E]">{value}</span></div>;
}

function RegistrantInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="space-y-1.5 text-sm font-semibold text-[#40372E]"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="input-premium h-11 font-normal" /></label>;
}
