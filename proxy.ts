import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ROOT_DOMAIN = "mesalink.pt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0].toLowerCase().replace(/\.$/, "");

  const isRootDomain =
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}`;

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  const isVercelPreview =
    hostname.includes("vercel.app");

  const isMesaLinkSubdomain =
    hostname.endsWith(`.${ROOT_DOMAIN}`) &&
    hostname !== `www.${ROOT_DOMAIN}`;

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
  if (pathname === "/" && (isRootDomain || isLocalhost || isVercelPreview)) {
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
    if (isMesaLinkSubdomain) {
      const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");

      if (
        subdomain &&
        subdomain !== "www" &&
        !pathname.startsWith("/api") &&
        !pathname.startsWith("/_next")
      ) {
        if (pathname === "/" || pathname === "/llms.txt") {
          url.pathname =
            pathname === "/" ? `/s/${subdomain}` : `/s/${subdomain}/llms.txt`;
          return NextResponse.rewrite(url);
        }
        return NextResponse.next();
      }
    }

    if (
      (pathname === "/" || pathname === "/llms.txt") &&
      !hostname.endsWith(`.${ROOT_DOMAIN}`)
    ) {
      try {
        const restaurant = await prisma.restaurant.findFirst({
          where: { customDomain: hostname, customDomainVerified: true },
          select: { slug: true },
        });
        if (restaurant) {
          url.pathname =
            pathname === "/"
              ? `/s/${restaurant.slug}`
              : `/s/${restaurant.slug}/llms.txt`;
          return NextResponse.rewrite(url);
        }
      } catch (error) {
        console.error("Custom domain routing failed", error);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
