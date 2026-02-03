"use server";

import {createClient} from "@/components/utils/supabase/server";
import {auth} from "@/lib/auth";
import {
  extractDescriptionFromHtml,
  extractTitleFromHtml,
  fetchTextWithTimeout,
  isHtmlContentType,
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

const qstash = new Client({token: process.env.QSTASH_TOKEN!});

export async function fetchUrlMetadata(
  normalized: URL,
  inputUrl: string,
): Promise<UrlMetadataResult> {
  const result: UrlMetadataResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
  };

  const res = await fetchTextWithTimeout(normalized.toString(), 8000, {
    userAgent: "void-metadata/1.0",
  });
  result.finalUrl = res.url;

  const contentType = res.headers.get("content-type") ?? "";
  if (!isHtmlContentType(contentType)) {
    return result;
  }

  const html = await res.text();
  result.title = extractTitleFromHtml(html);
  result.description = extractDescriptionFromHtml(html);
  return result;
}

export async function addBookmark(input: {url: string}): Promise<AddBookmarkResult> {
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

  // If no fields to update, return early
  if (Object.keys(updateData).length === 0) {
    return {ok: true};
  }

  const supabase = await createClient();

  const {error} = await supabase
    .from("bookmarks")
    .update(updateData)
    .eq("id", bookmarkId)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return {ok: true};
}
