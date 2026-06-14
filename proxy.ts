import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = "mesalink.pt";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // MOBILE REDIRECT
  if (pathname === "/") {
    const userAgent = request.headers.get("user-agent") || "";

    const isMobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(userAgent);

    if (isMobile) {
      const url = request.nextUrl.clone();
      url.pathname = "/mobile";
      return NextResponse.redirect(url);
    }
  }

  // SUBDOMAIN ROUTING
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];

  const isRootDomain =
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}`;

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  const isVercelPreview =
    hostname.includes("vercel.app");

  if (!isRootDomain && !isLocalhost && !isVercelPreview) {
    if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
      const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");

      if (
        subdomain &&
        subdomain !== "www" &&
        !pathname.startsWith("/api") &&
        !pathname.startsWith("/_next")
      ) {
        url.pathname = `/s/${subdomain}`;

        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};