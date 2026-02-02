import {NextRequest, NextResponse} from "next/server";
import {
  fetchBestFaviconOne,
  fetchBrowserlessScreenshotDataUrl,
  fetchResolvedOgImageUrl,
  isRecord,
  normalizeInputUrl,
} from "@/lib/web-fetch";

export const runtime = "nodejs";

async function readJobPayload(request: NextRequest): Promise<{url?: string; id?: unknown}> {
  const urlFromQuery = request.nextUrl.searchParams.get("url") ?? undefined;
  const idFromQuery = request.nextUrl.searchParams.get("id") ?? undefined;
  if (urlFromQuery) return {url: urlFromQuery, id: idFromQuery};

  // Try to read the request body as JSON (for QStash POST requests)
  const text = await request.text().catch(() => "");
  if (!text) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return {};
    return {url: typeof parsed.url === "string" ? parsed.url : undefined, id: parsed.id};
  } catch {
    return {};
  }
}

async function runEnrichment(inputUrl: string) {
  const normalized = normalizeInputUrl(inputUrl).toString();

  await Promise.allSettled([
    fetchBestFaviconOne(normalized),
    fetchResolvedOgImageUrl(normalized),
    fetchBrowserlessScreenshotDataUrl(normalized),
  ]);
}

export async function POST(request: NextRequest) {
  const payload = await readJobPayload(request);
  if (!payload.url) {
    return NextResponse.json({error: "Missing url"}, {status: 400});
  }

  try {
    await runEnrichment(payload.url);
  } catch (e) {
    console.error("enrich-bookmark failed", e);
  }

  return NextResponse.json(
    {success: true},
    {
      headers: {"cache-control": "no-store"},
    },
  );
}
