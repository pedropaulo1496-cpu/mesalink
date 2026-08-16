CREATE TABLE "SitePageView" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "referrer" TEXT,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "medium" TEXT,
    "campaign" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "device" TEXT NOT NULL DEFAULT 'desktop',
    "browser" TEXT,
    "language" TEXT,
    "isNewVisitor" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SitePageView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SitePageView_eventKey_key" ON "SitePageView"("eventKey");
CREATE INDEX "SitePageView_createdAt_idx" ON "SitePageView"("createdAt");
CREATE INDEX "SitePageView_visitorId_createdAt_idx" ON "SitePageView"("visitorId", "createdAt");
CREATE INDEX "SitePageView_sessionId_createdAt_idx" ON "SitePageView"("sessionId", "createdAt");
CREATE INDEX "SitePageView_path_createdAt_idx" ON "SitePageView"("path", "createdAt");
CREATE INDEX "SitePageView_source_createdAt_idx" ON "SitePageView"("source", "createdAt");
