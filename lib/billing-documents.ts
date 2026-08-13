import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

export type MesaLinkInvoiceDocument = {
  id: string;
  number: string;
  createdAt: Date;
  description: string;
  totalCents: number | null;
  currency: string;
  status: string;
  hostedUrl: string | null;
  pdfUrl: string | null;
};

type ReferralInvoiceFallback = {
  id: string;
  number?: string | null;
  createdAt: Date;
  description: string;
  totalCents?: number | null;
  currency: string;
  status?: string;
  hostedUrl?: string | null;
  pdfUrl?: string | null;
};

export async function listMesaLinkInvoices({
  stripeCustomerId,
  emails,
  referralInvoices = [],
}: {
  stripeCustomerId?: string | null;
  emails: Array<string | null | undefined>;
  referralInvoices?: ReferralInvoiceFallback[];
}) {
  const customerIds = new Set<string>();
  if (stripeCustomerId) customerIds.add(stripeCustomerId);

  if (process.env.STRIPE_SECRET_KEY) {
    for (const email of new Set(emails.map((value) => value?.trim().toLowerCase()).filter(Boolean) as string[])) {
      try {
        const customers = await stripe.customers.list({ email, limit: 100 });
        for (const customer of customers.data) customerIds.add(customer.id);
      } catch (error) {
        console.error("Unable to find Stripe customers for billing archive", error);
      }
    }
  }

  const documents = new Map<string, MesaLinkInvoiceDocument>();
  if (process.env.STRIPE_SECRET_KEY) {
    for (const customer of customerIds) {
      try {
        const invoices = await stripe.invoices.list({ customer, limit: 100 });
        for (const invoice of invoices.data) {
          if (invoice.status === "draft") continue;
          documents.set(invoice.id, mapStripeInvoice(invoice));
        }
      } catch (error) {
        console.error(`Unable to load Stripe invoices for customer ${customer}`, error);
      }
    }
  }

  for (const invoice of referralInvoices) {
    if (documents.has(invoice.id)) continue;
    documents.set(invoice.id, {
      id: invoice.id,
      number: invoice.number || shortInvoiceReference(invoice.id),
      createdAt: invoice.createdAt,
      description: invoice.description,
      totalCents: invoice.totalCents ?? null,
      currency: invoice.currency,
      status: invoice.status || "paid",
      hostedUrl: invoice.hostedUrl || null,
      pdfUrl: invoice.pdfUrl || null,
    });
  }

  return [...documents.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function mapStripeInvoice(invoice: Stripe.Invoice): MesaLinkInvoiceDocument {
  const firstLine = invoice.lines.data.find((line) => Boolean(line.description));
  const description = invoice.description
    || firstLine?.description
    || (invoice.metadata?.kind === "REFERRAL_AUTHORIZATION" ? "Serviço MesaLink Partners" : "Serviço MesaLink");

  return {
    id: invoice.id,
    number: invoice.number || shortInvoiceReference(invoice.id),
    createdAt: new Date((invoice.status_transitions.finalized_at || invoice.created) * 1000),
    description,
    totalCents: invoice.total,
    currency: invoice.currency,
    status: invoice.status || "open",
    hostedUrl: invoice.hosted_invoice_url,
    pdfUrl: invoice.invoice_pdf,
  };
}

function shortInvoiceReference(id: string) {
  return `ML-${id.slice(-10).toUpperCase()}`;
}
