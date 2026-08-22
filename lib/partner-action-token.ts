import { createHmac, timingSafeEqual } from "node:crypto";

const SCOPE = "RESTAURANT_INVITE";

function secret() {
  const value = process.env.NEXTAUTH_SECRET?.trim();
  if (!value) throw new Error("PARTNER_ACTION_SECRET_MISSING");
  return value;
}

export function issuePartnerRestaurantInviteToken(partnerId: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ partnerId, scope: SCOPE, expiresAt: now + 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPartnerRestaurantInviteToken(token: string, now = Date.now()) {
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expectedSignature = createHmac("sha256", secret()).update(payload).digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { partnerId?: unknown; scope?: unknown; expiresAt?: unknown };
    if (parsed.scope !== SCOPE || typeof parsed.partnerId !== "string" || !parsed.partnerId || typeof parsed.expiresAt !== "number" || parsed.expiresAt <= now) return null;
    return parsed.partnerId;
  } catch {
    return null;
  }
}
