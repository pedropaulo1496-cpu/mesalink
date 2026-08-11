import { randomBytes } from "node:crypto";

export function createMarketingTrackingToken() {
  return randomBytes(24).toString("hex");
}

export function getMarketingTrackingUrls(baseUrl: string, token: string) {
  const origin = baseUrl.replace(/\/+$/, "");

  return {
    clickUrl: `${origin}/api/marketing/track/click/${token}`,
    openUrl: `${origin}/api/marketing/track/open/${token}`,
  };
}

export function marketingTrackingPixel(openUrl: string) {
  return `<img src="${openUrl}" width="1" height="1" alt="" aria-hidden="true" style="display:block;width:1px;height:1px;border:0;opacity:0" />`;
}
