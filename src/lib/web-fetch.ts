export function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function looksLikePrivateHostname(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0" || h === "127.0.0.1" || h === "::1") return true;
  if (h.endsWith(".local")) return true;

  // Block obvious private IPv4 ranges if hostname is an IPv4 literal.
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!ipv4) return false;
  const parts = ipv4.slice(1).map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function normalizeInputUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Missing url");
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  const u = new URL(withScheme);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported");
  }
  if (!u.hostname) throw new Error("Invalid URL hostname");
  if (looksLikePrivateHostname(u.hostname)) throw new Error("Hostname is not allowed");
  return u;
}

export async function fetchTextWithTimeout(
  url: string,
  timeoutMs: number,
  options?: {userAgent?: string; accept?: string},
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        accept:
          options?.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "user-agent": options?.userAgent ?? "void/1.0",
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  options?: {userAgent?: string; accept?: string},
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        accept: options?.accept ?? "application/json,text/json,*/*;q=0.8",
        "user-agent": options?.userAgent ?? "void/1.0",
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
