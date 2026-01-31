import {NextRequest, NextResponse} from "next/server";
import {fetchTextWithTimeout, normalizeInputUrl, stripWrappingQuotes} from "@/lib/web-fetch";

export const runtime = "nodejs";

type PreviewResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  screenshotDataUrl?: string;
  screenshotContentType?: string;
  screenshotBytes?: number;
  screenshotError?: string;
};

function decodeHtmlEntities(s: string) {
  // Minimal decoding for common entities found in <title>/<meta>.
  return (
    s
      .replaceAll("&amp;", "&")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      // collapse whitespace
      .replaceAll(/\s+/g, " ")
      .trim()
  );
}

async function fetchBrowserlessScreenshotDataUrl(url: string) {
  const token = process.env.BROWSERLESS_API_KEY;
  if (!token) {
    throw new Error("Missing BROWSERLESS_TOKEN");
  }

  const response = await fetch(`https://production-sfo.browserless.io/screenshot?token=${token}`, {
    method: "POST",
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Browserless screenshot failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ""}`,
    );
  }

  const contentTypeRaw = response.headers.get("content-type") ?? "image/png";
  const contentType = contentTypeRaw.split(";")[0] ?? "image/png";
  const imageBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(imageBuffer).toString("base64");

  return {
    dataUrl: `data:${contentType};base64,${base64}`,
    contentType,
    bytes: imageBuffer.byteLength,
  };
}

function extractMetaContent(html: string, key: {name?: string; property?: string}) {
  const keyName = key.name?.toLowerCase();
  const keyProp = key.property?.toLowerCase();

  // Very small/naive HTML parsing via regex (good enough for "simple").
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const nameMatch = /\bname\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);
    const propMatch = /\bproperty\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);
    const contentMatch = /\bcontent\s*=\s*(".*?"|'.*?'|[^\s>]+)/i.exec(tag);

    if (!contentMatch) continue;
    const content = stripWrappingQuotes(contentMatch[1] ?? "");

    if (keyName && nameMatch) {
      const name = stripWrappingQuotes(nameMatch[1] ?? "").toLowerCase();
      if (name === keyName) return decodeHtmlEntities(content);
    }
    if (keyProp && propMatch) {
      const prop = stripWrappingQuotes(propMatch[1] ?? "").toLowerCase();
      if (prop === keyProp) return decodeHtmlEntities(content);
    }
  }

  return undefined;
}

function extractTitle(html: string) {
  // Prefer OG title when present, then fallback to <title>.
  const ogTitle = extractMetaContent(html, {property: "og:title"});
  if (ogTitle) return ogTitle;

  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m) return undefined;
  return decodeHtmlEntities(m[1] ?? "");
}

function extractDescription(html: string) {
  // Prefer OG description, then standard meta description.
  const og = extractMetaContent(html, {property: "og:description"});
  if (og) return og;
  return extractMetaContent(html, {name: "description"});
}

function extractOgImageUrl(html: string) {
  // Keep it simple: OG image first. (You can add twitter:image and fallbacks later.)
  return (
    extractMetaContent(html, {property: "og:image:secure_url"}) ??
    extractMetaContent(html, {property: "og:image:url"}) ??
    extractMetaContent(html, {property: "og:image"})
  );
}

export async function GET(request: NextRequest) {
  const inputUrl = request.nextUrl.searchParams.get("url") ?? "";

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(inputUrl);
  } catch (e) {
    return NextResponse.json(
      {error: e instanceof Error ? e.message : "Invalid url"},
      {status: 400},
    );
  }

  const result: PreviewResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
  };

  try {
    const normalizedUrl = normalized.toString();

    // Always attempt both:
    // - HTML fetch for title/description/og:image
    // - Browserless screenshot (returns an image)
    const [res, screenshot] = await Promise.all([
      fetchTextWithTimeout(normalizedUrl, 8000, {userAgent: "void-preview/1.0"}),
      fetchBrowserlessScreenshotDataUrl(normalizedUrl).catch((e) => ({
        error: e instanceof Error ? e.message : "Browserless screenshot failed",
      })),
    ]);

    result.finalUrl = res.url;
    if ("error" in screenshot) {
      result.screenshotError = screenshot.error;
    } else {
      result.screenshotDataUrl = screenshot.dataUrl;
      result.screenshotContentType = screenshot.contentType;
      result.screenshotBytes = screenshot.bytes;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml");
    if (!isHtml) {
      return NextResponse.json(
        {...result, title: undefined, description: undefined},
        {headers: {"cache-control": "no-store"}},
      );
    }

    const html = await res.text();
    result.title = extractTitle(html);
    result.description = extractDescription(html);
    const ogImage = extractOgImageUrl(html);
    if (ogImage) {
      try {
        // Resolve relative URLs against the final fetched URL.
        result.imageUrl = new URL(ogImage, res.url || normalized.toString()).toString();
      } catch {
        // ignore invalid URLs
      }
    }
  } catch (e) {
    return NextResponse.json(
      {error: e instanceof Error ? e.message : "Request failed"},
      {status: 500},
    );
  }

  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
