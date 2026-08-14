import { Vercel } from "@vercel/sdk";

// Project and team identifiers are public routing identifiers, not credentials.
// Keeping the MesaLink defaults here means the feature does not depend on the
// optional Vercel setting that exposes system environment variables at runtime.
const MESALINK_VERCEL_PROJECT_ID = "prj_cr1D9Oqbooj5yplKlqLPJ7vRZU9G";
const MESALINK_VERCEL_TEAM_ID = "team_yYXEcXff5RGQOe4FMPcpUMG4";

export type DomainRegistrant = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  companyName?: string;
  additional?: Record<string, unknown>;
};

function getConfig() {
  const token =
    process.env.MESALINK_VERCEL_API_TOKEN ||
    process.env.VERCEL_API_TOKEN ||
    process.env.VERCEL_ACCESS_TOKEN;
  const projectId =
    process.env.MESALINK_VERCEL_PROJECT_ID ||
    process.env.VERCEL_PROJECT_ID ||
    MESALINK_VERCEL_PROJECT_ID;
  const teamId =
    process.env.MESALINK_VERCEL_TEAM_ID ||
    process.env.VERCEL_TEAM_ID ||
    MESALINK_VERCEL_TEAM_ID;
  if (!token || !projectId) {
    throw new Error("A ligação central de domínios ainda não está configurada.");
  }
  return { token, projectId, teamId };
}

function client() {
  const { token } = getConfig();
  return new Vercel({
    bearerToken: token,
    timeoutMs: 12_000,
    retryConfig: { strategy: "backoff", backoff: { initialInterval: 250, maxInterval: 2_000, exponent: 1.7, maxElapsedTime: 8_000 } },
  });
}

function scope() {
  const { teamId } = getConfig();
  return teamId ? { teamId } : {};
}

export function isVercelDomainServiceConfigured() {
  return Boolean(
    process.env.MESALINK_VERCEL_API_TOKEN ||
      process.env.VERCEL_API_TOKEN ||
      process.env.VERCEL_ACCESS_TOKEN,
  );
}

export async function quoteVercelDomain(domain: string) {
  const vercel = client();
  const [availability, price] = await Promise.all([
    vercel.domainsRegistrar.getDomainAvailability({ domain, ...scope() }),
    vercel.domainsRegistrar.getDomainPrice({ domain, years: "1", ...scope() }),
  ]);

  return {
    available: availability.available,
    years: price.years,
    purchasePrice: Number(price.purchasePrice),
    renewalPrice: Number(price.renewalPrice),
  };
}

export async function buyVercelDomain(input: {
  domain: string;
  expectedPrice: number;
  registrant: DomainRegistrant;
}) {
  const vercel = client();
  const result = await vercel.domainsRegistrar.buySingleDomain({
    domain: input.domain,
    ...scope(),
    requestBody: {
      autoRenew: false,
      years: 1,
      expectedPrice: input.expectedPrice,
      contactInformation: input.registrant,
    },
  });
  return result.orderId;
}

export async function getVercelDomainOrder(orderId: string) {
  return client().domainsRegistrar.getOrder({ orderId, ...scope() });
}

export async function isDomainOwnedByVercelAccount(domain: string) {
  try {
    await client().domains.getDomain({ domain, ...scope() });
    return true;
  } catch {
    return false;
  }
}

export async function provisionVercelProjectDomain(domain: string) {
  const vercel = client();
  const { projectId } = getConfig();
  let projectDomain;

  try {
    projectDomain = await vercel.projects.addProjectDomain({
      idOrName: projectId,
      ...scope(),
      requestBody: { name: domain },
    });
  } catch {
    projectDomain = await vercel.projects.getProjectDomain({
      idOrName: projectId,
      domain,
      ...scope(),
    });
  }

  if (!projectDomain.verified) {
    try {
      projectDomain = await vercel.projects.verifyProjectDomain({
        idOrName: projectId,
        domain,
        ...scope(),
      });
    } catch {
      projectDomain = await vercel.projects.getProjectDomain({
        idOrName: projectId,
        domain,
        ...scope(),
      });
    }
  }

  const configuration = await vercel.domains.getDomainConfig({
    domain,
    projectIdOrName: projectId,
    ...scope(),
  });
  const verification = projectDomain.verification || [];
  const dnsRecords: Array<{ type: string; name: string; value: string }> = [];

  for (const challenge of verification) {
    dnsRecords.push({
      type: challenge.type,
      name: challenge.domain,
      value: challenge.value,
    });
  }

  if (configuration.misconfigured) {
    if (domain === projectDomain.apexName) {
      for (const value of configuration.recommendedIPv4[0]?.value || ["76.76.21.21"]) {
        dnsRecords.push({ type: "A", name: "@", value });
      }
    } else {
      dnsRecords.push({
        type: "CNAME",
        name: domain.replace(`.${projectDomain.apexName}`, ""),
        value: configuration.recommendedCNAME[0]?.value || "cname.vercel-dns.com",
      });
    }
  }

  return {
    verified: projectDomain.verified,
    configured: !configuration.misconfigured,
    dnsRecords,
    verification,
  };
}
