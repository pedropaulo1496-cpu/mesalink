import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = "mesalink.pt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // LOGGED-IN USER ON THE HOMEPAGE -> STRAIGHT TO THEIR DASHBOARD
  if (pathname === "/" && (isRootDomain || isLocalhost || isVercelPreview)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // MOBILE REDIRECT
  if (pathname === "/") {
    const userAgent = request.headers.get("user-agent") || "";

    const isMobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(userAgent);
    const isSearchCrawler =
      /Googlebot|Google-InspectionTool|Bingbot|DuckDuckBot|YandexBot|Applebot/i.test(
        userAgent,
      );

    if (isMobile && !isSearchCrawler) {
      const url = request.nextUrl.clone();
      url.pathname = "/mobile";
      return NextResponse.redirect(url);
    }
  }

  // SUBDOMAIN ROUTING
  const url = request.nextUrl.clone();

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
