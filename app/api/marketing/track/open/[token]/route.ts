import { prisma } from "@/lib/prisma";

const transparentGif = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    if (/^[a-f0-9]{48}$/.test(token)) {
      const action = await prisma.marketingAction.findUnique({
        where: { trackingToken: token },
        select: { id: true, openedAt: true },
      });

      if (action) {
        const now = new Date();
        await prisma.$transaction([
          prisma.marketingAction.update({
            where: { id: action.id },
            data: {
              openCount: { increment: 1 },
              openedAt: action.openedAt ?? now,
              lastOpenedAt: now,
            },
          }),
          prisma.marketingAction.updateMany({
            where: { id: action.id, status: { in: ["QUEUED", "SENT"] } },
            data: { status: "OPENED" },
          }),
        ]);
      }
    }
  } catch (error) {
    console.error("Marketing open tracking failed", error);
  }

  return new Response(transparentGif, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(transparentGif.length),
      "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
