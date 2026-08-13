const PUBLIC_CUSTOMER_ORIGIN = (process.env.NEXT_PUBLIC_CUSTOMER_ORIGIN || "https://mesalink.pt").replace(/\/+$/, "");

/**
 * Customer-facing links deliberately use the apex domain. Android apps are
 * associated with www.mesalink.pt, so this origin opens in the browser even
 * when a legacy MesaLink APK is still installed.
 */
export function publicCustomerOrigin() {
  return PUBLIC_CUSTOMER_ORIGIN;
}

export function publicReservationUrl(slug: string) {
  return `${PUBLIC_CUSTOMER_ORIGIN}/reserve/${encodeURIComponent(slug)}`;
}
