import {NextRequest, NextResponse} from "next/server";
import {
  fetchJsonWithTimeout,
  fetchTextWithTimeout,
  isRecord,
  normalizeInputUrl,
  stripWrappingQuotes,
} from "@/lib/web-fetch";

type IconSource = "html" | "manifest" | "fallback";

type FaviconResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  baseUrl?: string;
  icons: Array<{
    url: string;
    rel?: string;
    sizes?: string;
    type?: string;
    source: IconSource;
  }>;
};

function parseAttributes(tag: string) {
  const attrs: Partial<Record<"href" | "rel" | "sizes" | "type", string>> = {};
  const re = /([a-zA-Z_:][a-zA-Z0-9_:\-]*)\s*=\s*(".*?"|'.*?'|[^\s>]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tag)) !== null) {
    const key = match[1].toLowerCase();
    const value = stripWrappingQuotes(match[2]);
    // Only keep the attributes we actually use (avoids dynamic key injection).
    if (key === "href") attrs.href = value;
    else if (key === "rel") attrs.rel = value;
    else if (key === "sizes") attrs.sizes = value;
    else if (key === "type") attrs.type = value;
  }
  return attrs;
}

// returns a new array where each URL appears only once.
function uniqByUrl<T extends {url: string}>(items: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

type ManifestIcon = {src: string; sizes?: string; type?: string};

function parseManifestIcons(manifest: unknown): ManifestIcon[] {
  if (!isRecord(manifest)) return [];
  const icons = manifest.icons;
  if (!Array.isArray(icons)) return [];

  const out: ManifestIcon[] = [];
  for (const icon of icons) {
    if (!isRecord(icon)) continue;
    if (typeof icon.src !== "string") continue;
    out.push({
      src: icon.src,
      sizes: typeof icon.sizes === "string" ? icon.sizes : undefined,
      type: typeof icon.type === "string" ? icon.type : undefined,
    });
  }
  return out;
}

async function discoverFromManifest(manifestUrl: string) {
  const res = await fetchJsonWithTimeout(manifestUrl, 6000, {userAgent: "void-favicon-finder/1.0"});
  if (!res.ok) return [];
  const manifestJson: unknown = await res.json();
  const icons = parseManifestIcons(manifestJson);

  return icons
    .map((icon) => {
      try {
        return {
          url: new URL(icon.src, manifestUrl).toString(),
          sizes: icon.sizes,
          type: icon.type,
          source: "manifest" as const,
        };
      } catch {
        return null;
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

function discoverFromHtml(html: string, baseUrl: string) {
  // Then without <base>, you’d resolve to:
  // https://example.com/some/icons/favicon-32.png (often wrong)
  // With <base>, you resolve to:
  //cdn.example.com/assets/icons/favicon-32.png (correct)
  const icons: FaviconResult["icons"] = [];

  // Optional <base href="..."> affects relative URL resolution.
  let effectiveBase = baseUrl;

  const baseMatch = html.match(/<base\b[^>]*>/i);
  if (baseMatch) {
    const attrs = parseAttributes(baseMatch[0]);
    const href = attrs["href"];
    if (href) {
      try {
        effectiveBase = new URL(href, baseUrl).toString();
      } catch {
        // ignore
      }
    }
  }

  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  let manifestUrl: string | undefined;

  for (const tag of linkTags) {
    const attrs = parseAttributes(tag);
    const relRaw = (attrs["rel"] ?? "").toLowerCase();
    const hrefRaw = attrs["href"];
    if (!hrefRaw) continue;

    const relTokens = relRaw.split(/\s+/).filter(Boolean);
    const isIconRel =
      relTokens.includes("icon") ||
      relTokens.includes("shortcut") ||
      relTokens.includes("shortcut-icon") ||
      relTokens.includes("shortcut-icon") ||
      relRaw.includes("apple-touch-icon") ||
      relTokens.includes("mask-icon");

    const isManifest = relTokens.includes("manifest");

    let resolved: string;
    try {
      resolved = new URL(hrefRaw, effectiveBase).toString();
    } catch {
      continue;
    }

    if (isManifest && !manifestUrl) {
      manifestUrl = resolved;
    }

    if (!isIconRel) continue;

    icons.push({
      url: resolved,
      rel: attrs["rel"],
      sizes: attrs["sizes"],
      type: attrs["type"],
      source: "html",
    });
  }

  return {icons, manifestUrl, effectiveBase};
}

function fallbackCandidates(origin: string) {
  const paths = [
    "/favicon.ico",
    "/favicon.png",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
    // "/android-chrome-192x192.png",
    // "/android-chrome-512x512.png",
  ];
  return paths.map((p) => ({
    url: new URL(p, origin).toString(),
    source: "fallback" as const,
  }));
}

function parseLargestSquareSize(sizes?: string) {
  if (!sizes) return undefined;
  // sizes can be: "16x16", "32x32 48x48", "any"
  const parts = sizes.split(/\s+/).filter(Boolean);
  let best: number | undefined;
  for (const part of parts) {
    if (part.toLowerCase() === "any") continue;
    const m = /^(\d+)\s*x\s*(\d+)$/i.exec(part);
    if (!m) continue;
    const w = Number(m[1]);
    const h = Number(m[2]);
    if (!Number.isFinite(w) || !Number.isFinite(h)) continue;
    if (w !== h) continue;
    best = best === undefined ? w : Math.max(best, w);
  }
  return best;
}

function guessTypeFromUrl(url: string) {
  const pathname = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  if (pathname.endsWith(".ico")) return "image/x-icon";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  return undefined;
}

function typeRank(mime?: string) {
  const t = (mime ?? "").toLowerCase();
  if (t.includes("png")) return 5;
  if (t.includes("svg")) return 4;
  if (t.includes("icon") || t.includes("ico")) return 3;
  if (t.includes("webp")) return 2;
  if (t.includes("jpeg") || t.includes("jpg")) return 1;
  return 0;
}

function sourceRank(source: IconSource) {
  if (source === "html") return 3;
  if (source === "manifest") return 2;
  return 1; // fallback
}

function relRank(rel?: string) {
  const r = (rel ?? "").toLowerCase();
  if (!r) return 0;
  if (r.split(/\s+/).includes("icon")) return 3;
  if (r.includes("apple-touch-icon")) return 2;
  if (r.split(/\s+/).includes("mask-icon")) return 1;
  return 0;
}

function selectBestIcon(icons: FaviconResult["icons"]) {
  if (icons.length === 0) return null;
  const scored = icons.map((icon) => {
    const inferredType = icon.type ?? guessTypeFromUrl(icon.url);
    const size = parseLargestSquareSize(icon.sizes);

    // Favor mid-sized icons for UI previews; still allow very large.
    const sizeScore = size === undefined ? 0 : size >= 64 && size <= 256 ? 3 : size >= 32 ? 2 : 1;

    const score =
      sourceRank(icon.source) * 1000 +
      typeRank(inferredType) * 100 +
      sizeScore * 10 +
      relRank(icon.rel);

    return {icon, score};
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.icon ?? null;
}

export async function GET(request: NextRequest) {
  const inputUrl = request.nextUrl.searchParams.get("url") ?? "";
  const modeParam = (request.nextUrl.searchParams.get("mode") ?? "all").toLowerCase();
  const mode = modeParam === "one" ? "one" : "all";

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(inputUrl);
  } catch (e) {
    return NextResponse.json(
      {error: e instanceof Error ? e.message : "Invalid url"},
      {status: 400},
    );
  }

  const origin = normalized.origin;
  const result: FaviconResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
    icons: [],
  };
  try {
    const htmlRes = await fetchTextWithTimeout(normalized.toString(), 8000, {
      userAgent: "void-favicon-finder/1.0",
    });
    result.finalUrl = htmlRes.url;
    const contentType = htmlRes.headers.get("content-type") ?? "";
    const isHtml = contentType.includes("text/html") || contentType.includes("application/xhtml");
    const html = isHtml ? await htmlRes.text() : "";

    const {
      icons: htmlIcons,
      manifestUrl,
      effectiveBase,
    } = discoverFromHtml(html, htmlRes.url || normalized.toString());
    result.baseUrl = effectiveBase;
    result.icons.push(...htmlIcons);

    if (manifestUrl) {
      try {
        const manifestIcons = await discoverFromManifest(manifestUrl);
        result.icons.push(...manifestIcons);
      } catch {
        // ignore manifest failures
      }
    }
  } catch {
    // If HTML fetch fails (CORS isn't relevant server-side, but network/timeouts happen),
    // we still return fallbacks based on origin.
  }

  result.icons.push(...fallbackCandidates(origin));
  result.icons = uniqByUrl(result.icons);

  if (mode === "one") {
    const best = selectBestIcon(result.icons);
    result.icons = best ? [best] : [];
  }

  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
