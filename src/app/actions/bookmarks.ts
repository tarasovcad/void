"use server";

import {createClient} from "@/components/utils/supabase/server";
import {auth} from "@/lib/auth";
import {
  extractDescriptionFromHtml,
  extractTitleFromHtml,
  fetchBrowserlessRenderedHtml,
  fetchTextWithTimeout,
  isHtmlContentType,
  looksLikeChallengeHtml,
  normalizeInputUrl,
} from "@/lib/web-fetch";
import {headers} from "next/headers";
import {Client} from "@upstash/qstash";
import {randomUUID} from "crypto";

export type AddBookmarkResult = {
  ok: true;
  url: string;
};

export type UrlMetadataResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
};

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  // Explicitly use local dev server when QSTASH_URL is set (e.g. http://127.0.0.1:8080)
  baseUrl: process.env.QSTASH_URL,
});

export async function fetchUrlMetadata(
  normalized: URL,
  inputUrl: string,
): Promise<UrlMetadataResult> {
  const result: UrlMetadataResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
  };

  // --- Fast path: simple fetch (works for ~95% of sites) ---
  const res = await fetchTextWithTimeout(normalized.toString(), 8000, {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  result.finalUrl = res.url;

  const contentType = res.headers.get("content-type") ?? "";
  if (!isHtmlContentType(contentType)) {
    return result;
  }

  let html = await res.text();
  let usedBrowserless = false;

  // --- Fallback: if the HTML looks like a Cloudflare/bot challenge page,
  //     use Browserless to get the real rendered HTML ---
  if (looksLikeChallengeHtml(html)) {
    try {
      html = await fetchBrowserlessRenderedHtml(normalized.toString());
      usedBrowserless = true;
    } catch {
      // Browserless fallback failed — continue with whatever we got
    }
  }

  result.title = extractTitleFromHtml(html);
  result.description = extractDescriptionFromHtml(html);

  // If title/description are still empty after Browserless, and it still
  // looks like a challenge page, treat as unavailable (don't store garbage)
  if (!usedBrowserless && looksLikeChallengeHtml(html)) {
    result.title = undefined;
    result.description = undefined;
  }

  // Graceful fallback: use the hostname as title when extraction failed
  if (!result.title) {
    result.title = normalized.hostname.replace(/^www\./, "");
  }

  return result;
}

export async function addBookmark(input: {
  url: string;
  tags?: string[];
}): Promise<AddBookmarkResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(input.url);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid url");
  }

  let metadata: UrlMetadataResult;
  try {
    metadata = await fetchUrlMetadata(normalized, input.url);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Failed to fetch metadata");
  }

  const supabase = await createClient();

  const bookmarkId = randomUUID();

  const {data, error} = await supabase
    .from("bookmarks")
    .insert({
      id: bookmarkId,
      url: normalized.toString(),
      title: metadata.title ?? null,
      user_id: session.user.id,
      description: metadata.description ?? null,
      kind: "website",
      preview_image: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bookmark-previews/${bookmarkId}/preview.png`,
    })
    .select("id")
    .single();

  if (error) throw error;

  // attach tags (bookmark creation should still succeed if tagging fails)
  const tagNames = (input.tags ?? []).filter(Boolean);
  if (tagNames.length > 0) {
    const {error: tagsError} = await supabase.rpc("attach_tags_to_bookmark", {
      p_bookmark_id: data.id,
      p_user_id: session.user.id,
      p_tag_names: tagNames,
    });
    if (tagsError) {
      console.error("Failed to attach tags to bookmark:", tagsError);
    }
  }

  const receiverUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/enrich-bookmark`;

  await qstash.publishJSON({
    url: receiverUrl,
    body: {
      url: normalized.toString(),
      id: data.id,
    },
    idempotencyKey: `bookmark-${data.id}`,
    headers: {
      "x-job-type": "enrich-bookmark",
      "x-version": "v1",
    },
    timeout: 30,
  });

  return {ok: true, url: normalized.toString()};
}

export type UpdateBookmarkData = {
  title?: string;
  description?: string;
  preview_image?: string;
  notes?: string;
};

export async function updateBookmark(
  bookmarkId: string,
  updates: UpdateBookmarkData,
): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Only include fields that are actually present in the updates object
  const updateData: Record<string, string> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.preview_image !== undefined) updateData.preview_image = updates.preview_image;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  // If no fields to update, return early
  if (Object.keys(updateData).length === 0) {
    return {ok: true};
  }

  const supabase = await createClient();

  const {error} = await supabase
    .from("bookmarks")
    .update({...updateData, updated_at: new Date().toISOString()})
    .eq("id", bookmarkId)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return {ok: true};
}

export async function deleteBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];

  const supabase = await createClient();

  const {error} = await supabase
    .from("bookmarks")
    .update({deleted_at: new Date().toISOString()})
    .in("id", ids)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return {ok: true};
}

export async function archiveBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];

  const supabase = await createClient();

  const {error} = await supabase
    .from("bookmarks")
    .update({archived_at: new Date().toISOString(), updated_at: new Date().toISOString()})
    .in("id", ids)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return {ok: true};
}

export async function resetBookmark(bookmarkId: string): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  // Look up the bookmark to get its URL
  const {data: bookmark, error: fetchError} = await supabase
    .from("bookmarks")
    .select("id, url")
    .eq("id", bookmarkId)
    .eq("user_id", session.user.id)
    .single();

  if (fetchError || !bookmark) {
    throw new Error("Bookmark not found");
  }

  // Re-fetch metadata (title, description) from the original URL
  const normalized = normalizeInputUrl(bookmark.url);
  const metadata = await fetchUrlMetadata(normalized, bookmark.url);

  // Update the bookmark row with fresh metadata
  const {error: updateError} = await supabase
    .from("bookmarks")
    .update({
      title: metadata.title ?? null,
      description: metadata.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookmarkId)
    .eq("user_id", session.user.id);

  if (updateError) throw updateError;

  // Queue a QStash job to re-fetch favicon, OG image, and screenshot
  const receiverUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/enrich-bookmark`;

  await qstash.publishJSON({
    url: receiverUrl,
    body: {
      url: normalized.toString(),
      id: bookmark.id,
    },
    headers: {
      "x-job-type": "enrich-bookmark",
      "x-version": "v1",
    },
    timeout: 30,
  });

  return {ok: true};
}
