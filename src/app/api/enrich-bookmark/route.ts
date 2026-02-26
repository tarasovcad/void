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

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
  });
}

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

function computeSafeKey(normalizedUrl: string, id?: unknown) {
  const urlHost = new URL(normalizedUrl).hostname;
  const rawKey = toSafeStorageKey(id) ?? urlHost;
  const safeKey = rawKey.replaceAll(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || urlHost;
  return safeKey;
}

async function uploadBytesToSupabase(opts: {
  bucket: string;
  objectPath: string;
  bytes: Buffer;
  contentType: string;
}) {
  const supabase = getSupabaseAdmin();
  const upload = await supabase.storage
    .from(opts.bucket)
    .upload(opts.objectPath, opts.bytes, {contentType: opts.contentType, upsert: true});
  if (upload.error) throw upload.error;
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

  const safeKey = computeSafeKey(normalizedUrl, id);
  const objectPath = `${safeKey}/favicon.png`;

  await uploadBytesToSupabase({
    bucket: "bookmark-favicons",
    objectPath,
    bytes: iconBuffer,
    contentType,
  });
}

async function uploadOgImageToSupabase(ogImageUrl: string, normalizedUrl: string, id?: unknown) {
  const res = await fetch(ogImageUrl, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    headers: {"user-agent": "void-enrich-bookmark/1.0"},
  });
  if (!res.ok) return;

  const contentTypeRaw = res.headers.get("content-type") ?? "image/png";
  const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
  const bytes = Buffer.from(await res.arrayBuffer());

  const safeKey = computeSafeKey(normalizedUrl, id);
  const objectPath = `${safeKey}/og.png`;

  await uploadBytesToSupabase({
    bucket: "bookmark-previews",
    objectPath,
    bytes,
    contentType,
  });
}

function decodeBase64DataUrl(dataUrl: string) {
  const idx = dataUrl.indexOf("base64,");
  if (idx === -1) throw new Error("Invalid dataUrl: missing base64,");
  const base64 = dataUrl.slice(idx + "base64,".length);
  return Buffer.from(base64, "base64");
}

async function uploadPreviewToSupabase(
  screenshot: {dataUrl: string; contentType: string},
  normalizedUrl: string,
  id?: unknown,
) {
  const bytes = decodeBase64DataUrl(screenshot.dataUrl);
  const safeKey = computeSafeKey(normalizedUrl, id);
  const objectPath = `${safeKey}/preview.png`;

  await uploadBytesToSupabase({
    bucket: "bookmark-previews",
    objectPath,
    bytes,
    contentType: screenshot.contentType || "image/png",
  });
}

async function runEnrichment(inputUrl: string, id?: unknown) {
  const normalized = normalizeInputUrl(inputUrl).toString();

  const results = await Promise.allSettled([
    fetchBestFaviconOne(normalized),
    fetchResolvedOgImageUrl(normalized),
    fetchBrowserlessScreenshotDataUrl(normalized),
  ]);

  const uploads: Promise<unknown>[] = [];

  const faviconResult = results[0];
  if (faviconResult?.status === "fulfilled") {
    const best = faviconResult.value;
    if (best?.url) {
      uploads.push(uploadFaviconToSupabase(best.url, normalized, id));
    }
  }

  const ogResult = results[1];
  if (ogResult?.status === "fulfilled") {
    const ogUrl = ogResult.value;
    if (typeof ogUrl === "string" && ogUrl) {
      uploads.push(uploadOgImageToSupabase(ogUrl, normalized, id));
    }
  }

  const previewResult = results[2];
  if (previewResult?.status === "fulfilled") {
    const preview = previewResult.value;
    if (preview && typeof preview.dataUrl === "string" && typeof preview.contentType === "string") {
      uploads.push(uploadPreviewToSupabase(preview, normalized, id));
    }
  }

  await Promise.allSettled(uploads);
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
