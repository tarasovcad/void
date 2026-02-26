import {createClient} from "@/components/utils/supabase/server";
import type {Bookmark} from "@/components/bookmark/Bookmark";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {tagNamesFromJoin, type BookmarkTagJoinRow} from "@/lib/bookmark-tags";
import {redirect} from "next/navigation";
import {headers} from "next/headers";
import AllItemsClient from "./AllItemsClient";
import BookmarksLoadError from "./BookmarksLoadError";
import {getCollections} from "@/app/actions/collections";

const PAGE_SIZE = 20;

type SearchParams = {
  tag?: string;
  tab?: string;
  collection?: string;
};

type BookmarkRowWithJoins = Bookmark & {
  bookmark_tags?: BookmarkTagJoinRow[] | null;
  bookmark_collections?: {collections: {id: string; name: string}}[] | null;
};
type TagsWithCountsRow = {id: string; name: string; count: number | string | null};

function normalizeTagParam(value: string | null | undefined) {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

const AllItems = async (props: {searchParams?: Promise<SearchParams>}) => {
  const searchParams = await props.searchParams;
  const tagFilter = normalizeTagParam(searchParams?.tag ?? searchParams?.tab);
  const collectionFilter = searchParams?.collection;

  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data?.user?.id) {
    redirect("/login");
  }

  const userId = data.user.id;
  const supabase = await createClient();

  const getBookmarksSelect = () => {
    const hasTag = !!tagFilter;
    const hasCollection = !!collectionFilter;

    switch (true) {
      case hasTag && hasCollection:
        return "*, bookmark_tags!inner(tags!inner(name)), bookmark_collections!inner(collections(id, name))";
      case hasTag:
        return "*, bookmark_tags!inner(tags!inner(name)), bookmark_collections(collections(id, name))";
      case hasCollection:
        return "*, bookmark_tags(tags(name)), bookmark_collections!inner(collections(id, name))";
      default:
        return "*, bookmark_tags(tags(name)), bookmark_collections(collections(id, name))";
    }
  };

  const bookmarksSelect = getBookmarksSelect();

  let bookmarksQuery = supabase
    .from("bookmarks")
    .select(bookmarksSelect as "*", {count: "exact"})
    .eq("user_id", userId)
    .is("archived_at", null)
    .is("deleted_at", null);

  if (tagFilter) {
    bookmarksQuery = bookmarksQuery.eq("bookmark_tags.tags.name", tagFilter);
  }

  if (collectionFilter) {
    bookmarksQuery = bookmarksQuery.eq("bookmark_collections.collection_id", collectionFilter);
  }

  const bookmarksPromise = bookmarksQuery
    .order("created_at", {ascending: false})
    .range(0, PAGE_SIZE - 1);

  const tagsPromise = supabase.rpc("get_tags_with_counts", {p_user_id: userId});
  const collectionsPromise = getCollections();

  const [
    {data: bookmarkRows, count: totalCount, error: bookmarksError},
    {data: tagsData, error: tagsError},
    collections,
  ] = await Promise.all([bookmarksPromise, tagsPromise, collectionsPromise]);

  if (tagsError) console.error("Failed to fetch tags with counts:", tagsError);

  const initialBookmarksWithTags: Bookmark[] = (
    (bookmarkRows ?? []) as unknown as BookmarkRowWithJoins[]
  ).map(({bookmark_tags, bookmark_collections, ...bookmark}) => ({
    ...(bookmark as Bookmark),
    tags: tagNamesFromJoin(bookmark_tags),
    collections: bookmark_collections?.map((bc) => bc.collections) ?? [],
  }));

  const tags = ((tagsData ?? []) as TagsWithCountsRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    count: typeof t.count === "string" ? Number(t.count) : (t.count ?? 0),
  }));
  if (bookmarksError) {
    return (
      <AppShell session={data} collections={collections}>
        <BookmarksLoadError error={bookmarksError} />
      </AppShell>
    );
  }

  return (
    <AppShell session={data} tags={tags} collections={collections}>
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
