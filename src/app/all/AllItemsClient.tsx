"use client";
import * as React from "react";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {cn} from "@/lib/utils";
import {useState} from "react";
import NumberFlow from "@number-flow/react";
import {Bookmark, BookmarkMenu, GridCard, ItemRow} from "@/components/Bookmark";
import {useInfiniteQuery, useMutationState} from "@tanstack/react-query";
import {supabase} from "@/components/utils/supabase/client";
import Spinner from "@/components/shadcn/coss-ui";
import {AnimatedItem} from "@/components/AnimatedItem";
import {ViewToggle, TypeSelect, SortSelect} from "./AllItemsToolbar";
import type {ViewMode, TypeFilter, SortMode} from "./AllItemsToolbar";
import {NewBookmarkRow, NewBookmarkGridCard} from "./NewBookmarkPlaceholder";
import {DeleteBookmarkDialog} from "./DeleteBookmarkDialog";
import {SelectionActionBar} from "./SelectionActionBar";

function LoadingSpinner({className}: {className?: string}) {
  return (
    <div className={className}>
      <Spinner className="mx-auto size-4 animate-spin" />
    </div>
  );
}

export default function AllItemsClient({
  userId,
  initialBookmarks,
  totalCount,
  PAGE_SIZE,
}: {
  userId: string | null;
  initialBookmarks: Bookmark[];
  totalCount: number;
  PAGE_SIZE: number;
}) {
  // ── View & filter state ──
  const [view, setView] = useState<ViewMode>("list");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortMode>("recent");

  // ── UI-only selection state (no server writes yet) ──
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // ── Context menu state ──
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItem, setMenuItem] = useState<Bookmark | undefined>(undefined);

  // ── Delete dialog state ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Bookmark | undefined>(undefined);

  // ── Refs for infinite scroll ──
  const scrollAreaRootRef = React.useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = React.useRef<HTMLDivElement | null>(null);

  // ── Add-bookmark mutation tracking ──
  // Watches the global "add-bookmark" mutation so we can show a skeleton
  // placeholder that crossfades into the real bookmark once it resolves.
  const addMutations = useMutationState({
    filters: {mutationKey: ["add-bookmark"]},
    select: (m) => ({
      status: m.state.status as string,
      inputUrl: (m.state.variables as {url: string} | undefined)?.url,
      resultUrl: (m.state.data as {url: string} | undefined)?.url,
    }),
  });

  const latestAdd = addMutations.at(-1);
  const isPending = latestAdd?.status === "pending";
  const isError = latestAdd?.status === "error";
  const inputUrl = latestAdd?.inputUrl;
  const resultUrl = latestAdd?.resultUrl;

  // ── Delete-bookmark mutation tracking ──
  // Collects IDs of bookmarks currently being deleted (pending/success)
  // so we can play an exit animation before removing them from the list.
  const deletingIds = useMutationState({
    filters: {mutationKey: ["delete-bookmark"]},
    select: (m) =>
      m.state.status === "pending" || m.state.status === "success"
        ? (m.state.variables as string)
        : null,
  }).filter((id): id is string => !!id);

  // ── Exit-animation lifecycle ──
  // Once the exit animation finishes, we add the ID to `animatedOutIds`
  // so it gets excluded from the visible list on the next render.
  const [animatedOutIds, setAnimatedOutIds] = React.useState<Set<string>>(new Set());

  const removingIds = React.useMemo(() => {
    return new Set(deletingIds.filter((id) => !animatedOutIds.has(id)));
  }, [deletingIds, animatedOutIds]);

  const handleItemRemoved = React.useCallback((id: string) => {
    setAnimatedOutIds((prev) => new Set(prev).add(id));
  }, []);

  // ── New-bookmark animation URL ──
  // This is set during render (React-sanctioned pattern for deriving state
  // from mutation status without an effect). When a bookmark is being added
  // we show a skeleton placeholder; on error we clear it immediately.
  const [animatingUrl, setAnimatingUrl] = useState<string | null>(null);

  if (isPending && inputUrl && animatingUrl !== inputUrl) {
    setAnimatingUrl(inputUrl);
  }
  if (isError && animatingUrl !== null) {
    setAnimatingUrl(null);
  }

  // ── Bookmarks query (paginated) ──
  const bookmarksQuery = useInfiniteQuery({
    queryKey: ["bookmarks", "all-items", userId, PAGE_SIZE, sort],
    enabled: !!userId,
    initialPageParam: 0,
    queryFn: async ({pageParam}) => {
      const offset = typeof pageParam === "number" ? pageParam : 0;

      if (!userId) {
        return {items: [] as Bookmark[], nextOffset: undefined as number | undefined};
      }

      let q = supabase.from("bookmarks").select("*").eq("user_id", userId);

      // Apply sort order
      if (sort === "oldest") {
        q = q.order("created_at", {ascending: true});
      } else if (sort === "az") {
        q = q.order("title", {ascending: true}).order("id", {ascending: true});
      } else {
        q = q.order("created_at", {ascending: false});
      }

      const {data, error} = await q.range(offset, offset + PAGE_SIZE - 1);
      if (error) throw error;

      const items = (data ?? []) as Bookmark[];
      const nextOffset = items.length < PAGE_SIZE ? undefined : offset + PAGE_SIZE;
      return {items, nextOffset};
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    // Only seed initial data for the default sort to avoid stale mismatch
    initialData:
      sort === "recent"
        ? {
            pageParams: [0],
            pages: [
              {
                items: initialBookmarks,
                nextOffset: initialBookmarks.length < PAGE_SIZE ? undefined : PAGE_SIZE,
              },
            ],
          }
        : undefined,
  });

  // ── Derived data ──
  const allBookmarks = React.useMemo(() => {
    return bookmarksQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [bookmarksQuery.data]);

  // Match the newly-added bookmark from the fetched list for the crossfade
  const resolvedBookmark =
    animatingUrl && resultUrl ? (allBookmarks.find((b) => b.url === resultUrl) ?? null) : null;

  // Optimistic total: server count + successful adds in this session
  const successCount = addMutations.filter((m) => m.status === "success").length;
  const currentTotalCount = totalCount + successCount;

  const handleTransitionDone = React.useCallback(() => setAnimatingUrl(null), []);

  const {hasNextPage, isFetchingNextPage, fetchNextPage} = bookmarksQuery;

  // ── Callbacks ──
  const openDeleteDialog = React.useCallback((item: Bookmark) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const openMenu = React.useCallback((item: Bookmark) => {
    setMenuItem(item);
    setMenuOpen(true);
  }, []);

  // ── Infinite scroll via IntersectionObserver ──
  // Watches a sentinel div at the bottom of the list. When it enters the
  // viewport (with 200px margin) we fetch the next page automatically.
  React.useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    const root = scrollAreaRootRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as Element | null;

    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {root, rootMargin: "200px 0px"},
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // ── Visible items (filtered, excluding animating/deleted) ──
  const visibleItems = React.useMemo(() => {
    let items =
      typeFilter === "all" ? allBookmarks : allBookmarks.filter((i) => i.kind === typeFilter);

    // Hide the bookmark currently crossfading in the placeholder slot
    if (resolvedBookmark) {
      items = items.filter((i) => i.id !== resolvedBookmark.id);
    }

    // Hide items whose exit animation already completed
    if (animatedOutIds.size > 0) {
      items = items.filter((i) => !animatedOutIds.has(i.id));
    }

    return items;
  }, [allBookmarks, typeFilter, resolvedBookmark, animatedOutIds]);

  const visibleIds = React.useMemo(() => visibleItems.map((i) => i.id), [visibleItems]);
  const selectedCount = selectedIds.size;

  React.useEffect(() => {
    if (!selectionMode) return;
    const visible = new Set(visibleIds);
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [selectionMode, visibleIds]);

  const setSelected = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleSelected = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setSelectionEnabled = React.useCallback((enabled: boolean) => {
    setSelectionMode(enabled);
    if (!enabled) setSelectedIds(new Set());
  }, []);

  const isInitialLoad = bookmarksQuery.isLoading && visibleItems.length === 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="bg-background/90 sticky top-0 z-10 border-b px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TypeSelect value={typeFilter} onChange={setTypeFilter} />
            <SortSelect value={sort} onChange={setSort} />
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "ring-border relative isolate flex h-8 gap-0.5 rounded-md bg-[rgba(255,255,255,0)] p-0.5",
                "shadow-[0_2px_4px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.06)] ring-1",
              )}>
              <button
                type="button"
                aria-pressed={selectionMode}
                onClick={() => setSelectionEnabled(!selectionMode)}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150 ease-out",
                  "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
                  selectionMode
                    ? "dark:text-foreground bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
                    : "hover:bg-muted/40 bg-transparent text-[#BBBBBB] dark:text-[#606060]",
                )}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.2476 10.8106L7.8498 11.2084C7.95533 11.3139 8.09843 11.3731 8.2476 11.3731C8.39678 11.3731 8.53987 11.3139 8.64532 11.2084L8.2476 10.8106ZM12.0203 7.83338C12.24 7.6137 12.24 7.25757 12.0203 7.0379C11.8006 6.81823 11.4445 6.81823 11.2248 7.0379L12.0203 7.83338ZM7.14533 8.91292C6.92566 8.69325 6.56951 8.69325 6.34984 8.91292C6.13016 9.1326 6.13016 9.4887 6.34984 9.70837L7.14533 8.91292ZM14.625 6.4125V11.5875H15.75V6.4125H14.625ZM11.5875 14.625H6.4125V15.75H11.5875V14.625ZM3.375 11.5875V6.4125H2.25V11.5875H3.375ZM6.4125 3.375H11.5875V2.25H6.4125V3.375ZM6.4125 14.625C5.77316 14.625 5.32748 14.6245 4.98051 14.5962C4.6401 14.5684 4.44453 14.5166 4.29639 14.4411L3.78566 15.4435C4.11881 15.6132 4.47892 15.684 4.8889 15.7175C5.29231 15.7505 5.79173 15.75 6.4125 15.75V14.625ZM2.25 11.5875C2.25 12.2083 2.24957 12.7077 2.28252 13.1111C2.31602 13.5211 2.38679 13.8811 2.55655 14.2144L3.55893 13.7036C3.48345 13.5555 3.4316 13.3599 3.40379 13.0195C3.37544 12.6725 3.375 12.2269 3.375 11.5875H2.25ZM4.29639 14.4411C3.97887 14.2793 3.72071 14.0211 3.55893 13.7036L2.55655 14.2144C2.82619 14.7436 3.25645 15.1738 3.78566 15.4435L4.29639 14.4411ZM14.625 11.5875C14.625 12.2269 14.6245 12.6725 14.5962 13.0195C14.5684 13.3599 14.5166 13.5555 14.4411 13.7036L15.4435 14.2144C15.6132 13.8811 15.684 13.5211 15.7175 13.1111C15.7505 12.7077 15.75 12.2083 15.75 11.5875H14.625ZM11.5875 15.75C12.2083 15.75 12.7077 15.7505 13.1111 15.7175C13.5211 15.684 13.8811 15.6132 14.2144 15.4435L13.7036 14.4411C13.5555 14.5166 13.3599 14.5684 13.0195 14.5962C12.6725 14.6245 12.2269 14.625 11.5875 14.625V15.75ZM14.4411 13.7036C14.2793 14.0211 14.0211 14.2793 13.7036 14.4411L14.2144 15.4435C14.7436 15.1738 15.1738 14.7436 15.4435 14.2144L14.4411 13.7036ZM15.75 6.4125C15.75 5.79173 15.7505 5.29231 15.7175 4.8889C15.684 4.47892 15.6132 4.11881 15.4435 3.78566L14.4411 4.29639C14.5166 4.44453 14.5684 4.6401 14.5962 4.98051C14.6245 5.32748 14.625 5.77316 14.625 6.4125H15.75ZM11.5875 3.375C12.2269 3.375 12.6725 3.37544 13.0195 3.40379C13.3599 3.4316 13.5555 3.48345 13.7036 3.55893L14.2144 2.55655C13.8811 2.38679 13.5211 2.31602 13.1111 2.28252C12.7077 2.24957 12.2083 2.25 11.5875 2.25V3.375ZM15.4435 3.78566C15.1738 3.25645 14.7436 2.82619 14.2144 2.55655L13.7036 3.55893C14.0211 3.72071 14.2793 3.97887 14.4411 4.29639L15.4435 3.78566ZM3.375 6.4125C3.375 5.77316 3.37544 5.32748 3.40379 4.98051C3.4316 4.6401 3.48345 4.44453 3.55893 4.29639L2.55655 3.78566C2.38679 4.11881 2.31602 4.47892 2.28252 4.8889C2.24957 5.29231 2.25 5.79173 2.25 6.4125H3.375ZM6.4125 2.25C5.79173 2.25 5.29231 2.24957 4.8889 2.28252C4.47892 2.31602 4.11881 2.38679 3.78566 2.55655L4.29639 3.55893C4.44453 3.48345 4.6401 3.4316 4.98051 3.40379C5.32748 3.37544 5.77316 3.375 6.4125 3.375V2.25ZM3.55893 4.29639C3.72071 3.97887 3.97887 3.72071 4.29639 3.55893L3.78566 2.55655C3.25645 2.82619 2.82619 3.25645 2.55655 3.78566L3.55893 4.29639ZM8.64532 11.2084L12.0203 7.83338L11.2248 7.0379L7.8498 10.4129L8.64532 11.2084ZM6.34984 9.70837L7.8498 11.2084L8.64532 10.4129L7.14533 8.91292L6.34984 9.70837Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </div>

      {/* Portalled overlays */}
      <BookmarkMenu
        item={menuItem}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onDelete={openDeleteDialog}
      />
      <DeleteBookmarkDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={itemToDelete}
      />

      {/* Item count */}
      <div className="text-muted-foreground flex items-center gap-1 px-6 py-3 text-xs">
        <NumberFlow value={currentTotalCount} /> items
      </div>
      {/* Scrollable content area */}
      <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
        <ScrollArea className="h-full" scrollbarGutter scrollFade>
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-6 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Skeleton placeholder for a newly-added bookmark */}
              {animatingUrl && (
                <NewBookmarkGridCard
                  url={animatingUrl}
                  bookmark={resolvedBookmark}
                  onDone={handleTransitionDone}
                />
              )}

              {isInitialLoad ? (
                <LoadingSpinner className="text-muted-foreground col-span-full py-8 text-center text-xs" />
              ) : (
                visibleItems.map((item, index) => (
                  <AnimatedItem
                    key={item.id}
                    id={item.id}
                    isRemoving={removingIds.has(item.id)}
                    onRemoved={handleItemRemoved}
                    variant="grid">
                    <div
                      className={cn(
                        "relative",
                        selectionMode &&
                          selectedIds.has(item.id) &&
                          "ring-primary rounded-md ring-2",
                      )}
                      onClickCapture={(e) => {
                        if (!selectionMode) return;
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelected(item.id);
                      }}>
                      <div
                        className={cn(
                          "bg-background/80 ring-border absolute top-2 left-2 z-20 rounded-md p-1 ring-1 backdrop-blur transition-all duration-200 ease-out",
                          selectionMode
                            ? "scale-100 opacity-100"
                            : "pointer-events-none scale-90 opacity-0",
                        )}
                        style={{
                          transitionDelay: selectionMode ? `${Math.min(index * 15, 120)}ms` : "0ms",
                        }}>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={(next) => setSelected(item.id, next === true)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${item.title}`}
                        />
                      </div>
                      <GridCard item={item} onOpenMenu={openMenu} onDelete={openDeleteDialog} />
                    </div>
                  </AnimatedItem>
                ))
              )}

              {/* Pagination loader */}
              {isFetchingNextPage && (
                <LoadingSpinner className="text-muted-foreground col-span-full py-6 text-center text-xs" />
              )}

              {/* Intersection observer sentinel */}
              <div ref={bottomSentinelRef} aria-hidden className="col-span-full h-px" />
            </div>
          ) : (
            <div className="border-t">
              {/* Skeleton placeholder for a newly-added bookmark */}
              {animatingUrl && (
                <NewBookmarkRow
                  url={animatingUrl}
                  bookmark={resolvedBookmark}
                  onDone={handleTransitionDone}
                />
              )}

              {isInitialLoad ? (
                <LoadingSpinner className="text-muted-foreground px-6 py-8 text-center text-xs" />
              ) : (
                visibleItems.map((item, index) => (
                  <AnimatedItem
                    key={item.id}
                    id={item.id}
                    isRemoving={removingIds.has(item.id)}
                    onRemoved={handleItemRemoved}
                    variant="list">
                    <div
                      className={cn(
                        "relative",
                        selectionMode && selectedIds.has(item.id) && "bg-muted",
                      )}
                      onClickCapture={(e) => {
                        if (!selectionMode) return;
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelected(item.id);
                      }}>
                      <ItemRow
                        item={item}
                        onOpenMenu={openMenu}
                        onDelete={openDeleteDialog}
                        selectionMode={selectionMode}
                        selectionIndex={index}
                        selectedIds={selectedIds}
                        setSelected={setSelected}
                      />
                    </div>
                  </AnimatedItem>
                ))
              )}

              {/* Pagination loader */}
              {isFetchingNextPage && (
                <LoadingSpinner className="text-muted-foreground px-6 py-6 text-center text-xs" />
              )}

              {/* Intersection observer sentinel */}
              <div ref={bottomSentinelRef} aria-hidden className="h-px" />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Floating selection action bar ── */}
      <SelectionActionBar
        visible={selectionMode && selectedCount > 0}
        selectedCount={selectedCount}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
