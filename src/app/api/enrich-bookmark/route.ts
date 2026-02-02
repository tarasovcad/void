import {NextRequest, NextResponse} from "next/server";
import {
  fetchBestFaviconOne,
  fetchBrowserlessScreenshotDataUrl,
  fetchResolvedOgImageUrl,
  isRecord,
  normalizeInputUrl,
} from "@/lib/web-fetch";
import {createClient as createSupabaseAdminClient} from "@supabase/supabase-js";
import {Receiver} from "@upstash/qstash";

export const runtime = "nodejs";

function getQstashReceiver() {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    throw new Error("Missing QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY");
  }
  return new Receiver({currentSigningKey, nextSigningKey});
}

async function verifyQstashRequest(request: NextRequest, rawBody: string) {
  const signature = request.headers.get("Upstash-Signature");
  if (!signature) return false;

  const url = new URL(request.url);
  url.search = "";
  url.hash = "";

  try {
    const receiver = getQstashReceiver();
    return await receiver.verify({
      signature,
      body: rawBody,
      url: url.toString(),
    });
  } catch {
    return false;
  }
}

async function readJobPayload(
  request: NextRequest,
  rawBody: string,
): Promise<{url?: string; id?: unknown}> {
  const urlFromQuery = request.nextUrl.searchParams.get("url") ?? undefined;
  const idFromQuery = request.nextUrl.searchParams.get("id") ?? undefined;
  if (urlFromQuery) return {url: urlFromQuery, id: idFromQuery};

  if (!rawBody) return {};
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!isRecord(parsed)) return {};
    return {url: typeof parsed.url === "string" ? parsed.url : undefined, id: parsed.id};
  } catch {
    return {};
  }
}

function toSafeStorageKey(v: unknown) {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

async function uploadFaviconToSupabase(bestIconUrl: string, normalizedUrl: string, id?: unknown) {
  const iconRes = await fetch(bestIconUrl, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    headers: {"user-agent": "void-enrich-bookmark/1.0"},
  });
  if (!iconRes.ok) return;

  const contentTypeRaw = iconRes.headers.get("content-type") ?? "image/png";
  const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
  const iconBuffer = Buffer.from(await iconRes.arrayBuffer());

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
  });

  const urlHost = new URL(normalizedUrl).hostname;
  const rawKey = toSafeStorageKey(id) ?? urlHost;
  const safeKey = rawKey.replaceAll(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || urlHost;
  const objectPath = `${safeKey}/favicon.png`;

  const upload = await supabase.storage
    .from("bookmark-favicons")
    .upload(objectPath, iconBuffer, {contentType, upsert: true});
  if (upload.error) throw upload.error;
}

async function runEnrichment(inputUrl: string, id?: unknown) {
  const normalized = normalizeInputUrl(inputUrl).toString();

  const results = await Promise.allSettled([
    fetchBestFaviconOne(normalized),
    fetchResolvedOgImageUrl(normalized),
    fetchBrowserlessScreenshotDataUrl(normalized),
  ]);

  const faviconResult = results[0];
  if (faviconResult?.status === "fulfilled") {
    const best = faviconResult.value;
    if (best?.url) {
      await uploadFaviconToSupabase(best.url, normalized, id);
    }
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => "");

  const isValid = await verifyQstashRequest(request, rawBody);
  if (!isValid) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const payload = await readJobPayload(request, rawBody);
  if (!payload.url) {
    return NextResponse.json({error: "Missing url"}, {status: 400});
  }

  try {
    await runEnrichment(payload.url, payload.id);
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
