import { createHmac, timingSafeEqual } from "node:crypto";
import { publicCustomerOrigin } from "@/lib/public-links";

function managementSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("Reservation management secret is not configured.");
  return secret;
}

export function createReservationManagementToken(reservationId: string, email: string) {
  return createHmac("sha256", managementSecret())
    .update(`${reservationId}:${email.trim().toLowerCase()}`)
    .digest("base64url");
}

export function verifyReservationManagementToken(reservationId: string, email: string, token: string) {
  if (!token || token.length > 128) return false;
  const expected = createReservationManagementToken(reservationId, email);
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(token);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function reservationManagementUrl(reservationId: string, email: string, intent?: "cancel") {
  const params = new URLSearchParams({ token: createReservationManagementToken(reservationId, email) });
  if (intent) params.set("intent", intent);
  return `${publicCustomerOrigin()}/reservation/${reservationId}/manage?${params.toString()}`;
}
