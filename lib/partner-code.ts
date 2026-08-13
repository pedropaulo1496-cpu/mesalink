import { randomBytes } from "crypto";

const PARTNER_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function createPartnerCode() {
  const bytes = randomBytes(8);
  const suffix = Array.from(bytes, (byte) => PARTNER_CODE_ALPHABET[byte % PARTNER_CODE_ALPHABET.length]).join("");
  return `MLP-${suffix}`;
}
