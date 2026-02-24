import {createClient} from "@/components/utils/supabase/server";
import type {Bookmark} from "@/components/bookmark/Bookmark";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {tagNamesFromJoin, type BookmarkTagJoinRow} from "@/lib/bookmark-tags";
import {redirect} from "next/navigation";
import {headers} from "next/headers";
import AllItemsClient from "./AllItemsClient";
import BookmarksLoadError from "./BookmarksLoadError";

const PAGE_SIZE = 20;

type SearchParams = {
  tag?: string;
  tab?: string;
};

type BookmarkRowWithJoins = Bookmark & {bookmark_tags?: BookmarkTagJoinRow[] | null};
type TagsWithCountsRow = {id: string; name: string; count: number | string | null};

function normalizeTagParam(value: string | null | undefined) {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

const AllItems = async (props: {searchParams?: Promise<SearchParams>}) => {
  const searchParams = await props.searchParams;
  const tagFilter = normalizeTagParam(searchParams?.tag ?? searchParams?.tab);

  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data?.user?.id) {
    redirect("/login");
  }

  const userId = data.user.id;
  const supabase = await createClient();

  const bookmarksSelect = tagFilter
    ? "*, bookmark_tags!inner(tags!inner(name))"
    : "*, bookmark_tags(tags(name))";

  let bookmarksQuery = supabase
    .from("bookmarks")
    .select(bookmarksSelect, {count: "exact"})
    .eq("user_id", userId)
    .is("archived_at", null)
    .is("deleted_at", null);

  if (tagFilter) {
    bookmarksQuery = bookmarksQuery.eq("bookmark_tags.tags.name", tagFilter);
  }

  const bookmarksPromise = bookmarksQuery
    .order("created_at", {ascending: false})
    .range(0, PAGE_SIZE - 1);

  const tagsPromise = supabase.rpc("get_tags_with_counts", {p_user_id: userId});

  const [
    {data: bookmarkRows, count: totalCount, error: bookmarksError},
    {data: tagsData, error: tagsError},
  ] = await Promise.all([bookmarksPromise, tagsPromise]);

  if (tagsError) console.error("Failed to fetch tags with counts:", tagsError);

  const initialBookmarksWithTags: Bookmark[] = ((bookmarkRows ?? []) as BookmarkRowWithJoins[]).map(
    ({bookmark_tags, ...bookmark}) => ({
      ...(bookmark as Bookmark),
      tags: tagNamesFromJoin(bookmark_tags),
    }),
  );

  const tags = ((tagsData ?? []) as TagsWithCountsRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    count: typeof t.count === "string" ? Number(t.count) : (t.count ?? 0),
  }));
  if (bookmarksError) {
    return (
      <AppShell session={data}>
        <BookmarksLoadError error={bookmarksError} />
      </AppShell>
    );
  }

  return (
    <AppShell session={data} tags={tags}>
      <AllItemsClient
        userId={userId}
        initialBookmarks={initialBookmarksWithTags}
        totalCount={totalCount ?? 0}
        PAGE_SIZE={PAGE_SIZE}
      />
    </AppShell>
  );
};

export default AllItems;
