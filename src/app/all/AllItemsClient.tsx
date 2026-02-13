"use client";

import * as React from "react";
import {Button} from "@/components/coss-ui/button";
import {Select, SelectItem, SelectPopup, SelectTrigger} from "@/components/coss-ui/select";
import {cn} from "@/lib/utils";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {useState} from "react";
import NumberFlow from "@number-flow/react";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/coss-ui/alert-dialog";
import {Bookmark, BookmarkMenu, GridCard, ItemRow} from "@/components/Bookmark";
import {
  useInfiniteQuery,
  useMutation,
  useMutationState,
  useQueryClient,
} from "@tanstack/react-query";
import {supabase} from "@/components/utils/supabase/client";
import Spinner from "@/components/shadcn/coss-ui";
import {Skeleton} from "@/components/coss-ui/skeleton";
import {formatDateAbsolute} from "@/lib/formatDate";
import {deleteBookmark} from "@/app/actions/bookmarks";
import {toastManager} from "@/components/coss-ui/toast";
import {AnimatedItem} from "@/components/AnimatedItem";

type ViewMode = "grid" | "list";
type TypeFilter = "all" | Bookmark["kind"];
type SortMode = "recent" | "oldest" | "az";

function getTypeLabel(value: TypeFilter) {
  switch (value) {
    case "all":
      return "All Types";
    case "website":
      return "Websites";
    case "image":
      return "Images";
  }
}

function getSortLabel(value: SortMode) {
  switch (value) {
    case "recent":
      return "Sort: Recent";
    case "oldest":
      return "Sort: Oldest";
    case "az":
      return "Sort: A–Z";
  }
}

function ViewToggle({value, onChange}: {value: ViewMode; onChange: (v: ViewMode) => void}) {
  const gridActive = value === "grid";
  const listActive = value === "list";

  return (
    <div
      className={cn(
        "ring-border relative isolate flex h-8 gap-0.5 rounded-md bg-[rgba(255,255,255,0)] p-0.5",
        "shadow-[0_2px_4px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.06)] ring-1",
      )}>
      <button
        type="button"
        aria-label="Grid view"
        aria-pressed={gridActive}
        onClick={() => onChange("grid")}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150 ease-out",
          "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
          gridActive
            ? "dark:text-foreground bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
            : "hover:bg-muted/40 bg-transparent text-[#BBBBBB] dark:text-[#606060]",
        )}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3.16667 2C2.52233 2 2 2.52233 2 3.16667C2 3.811 2.52233 4.33333 3.16667 4.33333C3.811 4.33333 4.33333 3.811 4.33333 3.16667C4.33333 2.52233 3.811 2 3.16667 2Z"
            fill="currentColor"
          />
          <path
            d="M8.00016 2C7.35583 2 6.8335 2.52233 6.8335 3.16667C6.8335 3.811 7.35583 4.33333 8.00016 4.33333C8.6445 4.33333 9.16683 3.811 9.16683 3.16667C9.16683 2.52233 8.6445 2 8.00016 2Z"
            fill="currentColor"
          />
          <path
            d="M12.8332 2C12.1888 2 11.6665 2.52233 11.6665 3.16667C11.6665 3.811 12.1888 4.33333 12.8332 4.33333C13.4775 4.33333 13.9998 3.811 13.9998 3.16667C13.9998 2.52233 13.4775 2 12.8332 2Z"
            fill="currentColor"
          />
          <path
            d="M3.16667 6.8335C2.52233 6.8335 2 7.35583 2 8.00016C2 8.6445 2.52233 9.16683 3.16667 9.16683C3.811 9.16683 4.33333 8.6445 4.33333 8.00016C4.33333 7.35583 3.811 6.8335 3.16667 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M8.00016 6.8335C7.35583 6.8335 6.8335 7.35583 6.8335 8.00016C6.8335 8.6445 7.35583 9.16683 8.00016 9.16683C8.6445 9.16683 9.16683 8.6445 9.16683 8.00016C9.16683 7.35583 8.6445 6.8335 8.00016 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M12.8332 6.8335C12.1888 6.8335 11.6665 7.35583 11.6665 8.00016C11.6665 8.6445 12.1888 9.16683 12.8332 9.16683C13.4775 9.16683 13.9998 8.6445 13.9998 8.00016C13.9998 7.35583 13.4775 6.8335 12.8332 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M3.16667 11.6665C2.52233 11.6665 2 12.1888 2 12.8332C2 13.4775 2.52233 13.9998 3.16667 13.9998C3.811 13.9998 4.33333 13.4775 4.33333 12.8332C4.33333 12.1888 3.811 11.6665 3.16667 11.6665Z"
            fill="currentColor"
          />
          <path
            d="M8.00016 11.6665C7.35583 11.6665 6.8335 12.1888 6.8335 12.8332C6.8335 13.4775 7.35583 13.9998 8.00016 13.9998C8.6445 13.9998 9.16683 13.4775 9.16683 12.8332C9.16683 12.1888 8.6445 11.6665 8.00016 11.6665Z"
            fill="currentColor"
          />
          <path
            d="M12.8332 11.6665C12.1888 11.6665 11.6665 12.1888 11.6665 12.8332C11.6665 13.4775 12.1888 13.9998 12.8332 13.9998C13.4775 13.9998 13.9998 13.4775 13.9998 12.8332C13.9998 12.1888 13.4775 11.6665 12.8332 11.6665Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="List view"
        aria-pressed={listActive}
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-150 ease-out",
          "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
          listActive
            ? "dark:text-foreground bg-[#F0F0F0] text-[#202020] dark:bg-[#181717]"
            : "hover:bg-muted/40 bg-transparent text-[#BBBBBB] dark:text-[#606060]",
        )}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1.3335 3.8335C1.3335 3.55736 1.55736 3.3335 1.8335 3.3335H14.1668C14.443 3.3335 14.6668 3.55736 14.6668 3.8335C14.6668 4.10964 14.443 4.3335 14.1668 4.3335H1.8335C1.55736 4.3335 1.3335 4.10964 1.3335 3.8335ZM1.3335 8.00016C1.3335 7.72403 1.55736 7.50016 1.8335 7.50016H14.1668C14.443 7.50016 14.6668 7.72403 14.6668 8.00016C14.6668 8.2763 14.443 8.50016 14.1668 8.50016H1.8335C1.55736 8.50016 1.3335 8.2763 1.3335 8.00016ZM1.3335 12.1668C1.3335 11.8907 1.55736 11.6668 1.8335 11.6668H14.1668C14.443 11.6668 14.6668 11.8907 14.6668 12.1668C14.6668 12.443 14.443 12.6668 14.1668 12.6668H1.8335C1.55736 12.6668 1.3335 12.443 1.3335 12.1668Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

function TypeSelect({value, onChange}: {value: TypeFilter; onChange: (v: TypeFilter) => void}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TypeFilter)}>
      <SelectTrigger aria-label="All Types" size="sm" className="min-w-36 rounded-md">
        <span className="text-muted-foreground sr-only">All Types</span>
        <span className="flex-1 truncate">{getTypeLabel(value)}</span>
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="website">Websites</SelectItem>
        <SelectItem value="image">Images</SelectItem>
      </SelectPopup>
    </Select>
  );
}

function SortSelect({value, onChange}: {value: SortMode; onChange: (v: SortMode) => void}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortMode)}>
      <SelectTrigger aria-label="Sort" size="sm" className="min-w-40 rounded-md">
        <span className="text-muted-foreground sr-only">Sort</span>
        <span className="flex-1 truncate">{getSortLabel(value)}</span>
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="recent">Sort: Recent</SelectItem>
        <SelectItem value="oldest">Sort: Oldest</SelectItem>
        <SelectItem value="az">Sort: A–Z</SelectItem>
      </SelectPopup>
    </Select>
  );
}

function CrossFade({
  loaded,
  delay = 0,
  skeleton,
  children,
}: {
  loaded: boolean;
  delay?: number;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-start *:col-start-1 *:row-start-1">
      <div
        className={cn(
          "transition-all duration-500",
          loaded ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        style={{transitionDelay: `${delay}ms`}}>
        {skeleton}
      </div>
      <div
        className={cn(
          "transition-all duration-500",
          loaded ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{transitionDelay: `${delay}ms`}}>
        {children}
      </div>
    </div>
  );
}

function NewBookmarkRow({
  url,
  bookmark,
  onDone,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
}) {
  const loaded = !!bookmark;

  React.useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [loaded, onDone]);

  return (
    <div className="flex w-full gap-5 border-b px-6 py-5 pr-16">
      <CrossFade loaded={loaded} delay={0} skeleton={<Skeleton className="size-9 rounded-md" />}>
        <div className="bg-muted size-9 rounded-md border" />
      </CrossFade>
      <div className="min-w-0 flex-1">
        <CrossFade
          loaded={!!bookmark?.title}
          delay={100}
          skeleton={<Skeleton className="h-4.5 w-48 rounded" />}>
          <div className="text-foreground truncate text-sm font-semibold">
            {bookmark?.title ?? url}
          </div>
        </CrossFade>
        <div className="mt-0.5">
          <CrossFade
            loaded={loaded}
            delay={200}
            skeleton={<Skeleton className="h-3.5 w-64 rounded" />}>
            <div className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs whitespace-nowrap">
              <span className="min-w-0 truncate">{bookmark?.url ?? url}</span>
              {bookmark ? (
                <>
                  <span className="shrink-0">-</span>
                  <span className="shrink-0">{formatDateAbsolute(bookmark.created_at)}</span>
                </>
              ) : null}
            </div>
          </CrossFade>
        </div>
        <div className="mt-2">
          <CrossFade
            loaded={!!bookmark?.description}
            delay={300}
            skeleton={<Skeleton className="h-4 w-40 rounded" />}>
            <div className="text-muted-foreground line-clamp-2 text-xs">
              {bookmark?.description ?? ""}
            </div>
          </CrossFade>
        </div>
      </div>
    </div>
  );
}

function NewBookmarkGridCard({
  url,
  bookmark,
  onDone,
}: {
  url: string;
  bookmark: Bookmark | null;
  onDone: () => void;
}) {
  const loaded = !!bookmark;

  React.useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [loaded, onDone]);

  return (
    <div className="bg-background w-full overflow-hidden rounded-md border">
      <CrossFade loaded={loaded} delay={0} skeleton={<Skeleton className="aspect-16/10 w-full" />}>
        <div className="bg-muted aspect-16/10 w-full" />
      </CrossFade>
      <div className="min-h-[92px] p-4">
        <CrossFade
          loaded={!!bookmark?.title}
          delay={150}
          skeleton={<Skeleton className="h-4 w-3/4 rounded" />}>
          <div className="text-foreground line-clamp-2 text-sm font-semibold">
            {bookmark?.title ?? url}
          </div>
        </CrossFade>
        <div className="mt-1">
          <CrossFade
            loaded={loaded}
            delay={300}
            skeleton={<Skeleton className="h-3 w-1/2 rounded" />}>
            <div className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs whitespace-nowrap">
              <span className="min-w-0 truncate">{bookmark?.url ?? url}</span>
              {bookmark ? (
                <>
                  <span className="shrink-0">-</span>
                  <span className="shrink-0">{formatDateAbsolute(bookmark.created_at)}</span>
                </>
              ) : null}
            </div>
          </CrossFade>
        </div>
      </div>
    </div>
  );
}

function DeleteBookmarkDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Bookmark;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationKey: ["delete-bookmark"],
    mutationFn: async (id: string) => {
      return deleteBookmark(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
      toastManager.add({
        title: "Bookmark deleted",
        type: "success",
      });
    },
    onError: (error) => {
      console.error("Failed to delete bookmark:", error);
      toastManager.add({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete bookmark",
        type: "error",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your bookmark and remove it
            from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              if (item) {
                deleteMutation.mutate(item.id);
                onOpenChange(false);
              }
            }}>
            Delete Bookmark
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
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
  const [view, setView] = useState<ViewMode>("list");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortMode>("recent");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItem, setMenuItem] = useState<Bookmark | undefined>(undefined);
  const scrollAreaRootRef = React.useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = React.useRef<HTMLDivElement | null>(null);

  // ── Track add-bookmark mutation for skeleton → real data crossfade ──
  const addMutations = useMutationState({
    filters: {mutationKey: ["add-bookmark"]},
    select: (m) => ({
      status: m.state.status as string,
      inputUrl: (m.state.variables as {url: string} | undefined)?.url,
      resultUrl: (m.state.data as {url: string} | undefined)?.url,
    }),
  });
  const latest = addMutations.at(-1);
  const isPending = latest?.status === "pending";
  const isError = latest?.status === "error";
  const inputUrl = latest?.inputUrl;
  const resultUrl = latest?.resultUrl;

  const deleteMutations = useMutationState({
    filters: {mutationKey: ["delete-bookmark"]},
    select: (m) =>
      m.state.status === "pending" || m.state.status === "success"
        ? (m.state.variables as string)
        : null,
  }).filter((id): id is string => !!id);

  // ── Track exit-animation lifecycle for deleted items ──
  const [animatedOutIds, setAnimatedOutIds] = React.useState<Set<string>>(new Set());

  const removingIds = React.useMemo(() => {
    return new Set(deleteMutations.filter((id) => !animatedOutIds.has(id)));
  }, [deleteMutations, animatedOutIds]);

  const handleItemRemoved = React.useCallback((id: string) => {
    setAnimatedOutIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const [animatingUrl, setAnimatingUrl] = useState<string | null>(null);

  if (isPending && inputUrl && animatingUrl !== inputUrl) {
    setAnimatingUrl(inputUrl);
  }
  if (isError && animatingUrl !== null) {
    setAnimatingUrl(null);
  }

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

      if (sort === "oldest") {
        q = q.order("created_at", {ascending: true});
      } else if (sort === "az") {
        q = q.order("title", {ascending: true}).order("id", {ascending: true});
      } else {
        // recent
        q = q.order("created_at", {ascending: false});
      }

      const {data, error} = await q.range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const items = (data ?? []) as Bookmark[];
      const nextOffset = items.length < PAGE_SIZE ? undefined : offset + PAGE_SIZE;
      return {items, nextOffset};
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
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

  const loadedBookmarks = React.useMemo(() => {
    return bookmarksQuery.data?.pages.flatMap((p) => p.items) ?? [];
  }, [bookmarksQuery.data]);

  // Find the newly added bookmark once the query refetches
  const resolvedBookmark =
    animatingUrl && resultUrl ? (loadedBookmarks.find((b) => b.url === resultUrl) ?? null) : null;

  const successCount = addMutations.filter((m) => m.status === "success").length;
  const currentTotalCount = totalCount + successCount;

  const handleTransitionDone = React.useCallback(() => setAnimatingUrl(null), []);

  const {hasNextPage, isFetchingNextPage, fetchNextPage} = bookmarksQuery;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Bookmark | undefined>(undefined);

  const openDeleteDialog = React.useCallback((item: Bookmark) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const openMenu = React.useCallback((item: Bookmark) => {
    setMenuItem(item);
    setMenuOpen(true);
  }, []);

  React.useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    const root = scrollAreaRootRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as Element | null;

    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }
      },

      {root, rootMargin: "200px 0px"},
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const filteredAndSortedItems = React.useMemo(() => {
    let filtered =
      typeFilter === "all" ? loadedBookmarks : loadedBookmarks.filter((i) => i.kind === typeFilter);

    // Exclude the bookmark being animated to avoid showing it twice
    if (resolvedBookmark) {
      filtered = filtered.filter((i) => i.id !== resolvedBookmark.id);
    }

    if (animatedOutIds.size > 0) {
      filtered = filtered.filter((i) => !animatedOutIds.has(i.id));
    }

    return filtered;
  }, [loadedBookmarks, typeFilter, resolvedBookmark, animatedOutIds]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="bg-background/90 sticky top-0 z-10 border-b px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TypeSelect value={typeFilter} onChange={setTypeFilter} />
            <SortSelect value={sort} onChange={setSort} />
          </div>
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>
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
      <div className="text-muted-foreground flex items-center gap-1 px-6 py-3 text-xs">
        <NumberFlow value={currentTotalCount} /> items
      </div>
      <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
        <ScrollArea className="h-full" scrollbarGutter scrollFade>
          {view === "grid" ? (
            <div className="grid grid-cols-1 gap-6 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {animatingUrl ? (
                <NewBookmarkGridCard
                  url={animatingUrl}
                  bookmark={resolvedBookmark}
                  onDone={handleTransitionDone}
                />
              ) : null}
              {bookmarksQuery.isLoading && filteredAndSortedItems.length === 0 ? (
                <div className="text-muted-foreground col-span-full py-8 text-center text-xs">
                  <Spinner className="mx-auto size-4 animate-spin" />
                </div>
              ) : (
                filteredAndSortedItems.map((item) => (
                  <AnimatedItem
                    key={item.id}
                    id={item.id}
                    isRemoving={removingIds.has(item.id)}
                    onRemoved={handleItemRemoved}
                    variant="grid">
                    <GridCard item={item} onOpenMenu={openMenu} onDelete={openDeleteDialog} />
                  </AnimatedItem>
                ))
              )}
              {bookmarksQuery.isFetchingNextPage ? (
                <div className="text-muted-foreground col-span-full py-6 text-center text-xs">
                  <Spinner className="mx-auto size-4 animate-spin" />
                </div>
              ) : null}
              <div ref={bottomSentinelRef} aria-hidden className="col-span-full h-px" />
            </div>
          ) : (
            <div className="border-t">
              {animatingUrl ? (
                <NewBookmarkRow
                  url={animatingUrl}
                  bookmark={resolvedBookmark}
                  onDone={handleTransitionDone}
                />
              ) : null}
              {bookmarksQuery.isLoading && filteredAndSortedItems.length === 0 ? (
                <div className="text-muted-foreground px-6 py-8 text-center text-xs">
                  <Spinner className="mx-auto size-4 animate-spin" />
                </div>
              ) : (
                filteredAndSortedItems.map((item) => (
                  <AnimatedItem
                    key={item.id}
                    id={item.id}
                    isRemoving={removingIds.has(item.id)}
                    onRemoved={handleItemRemoved}
                    variant="list">
                    <ItemRow item={item} onOpenMenu={openMenu} onDelete={openDeleteDialog} />
                  </AnimatedItem>
                ))
              )}
              {bookmarksQuery.isFetchingNextPage ? (
                <div className="text-muted-foreground px-6 py-6 text-center text-xs">
                  <Spinner className="mx-auto size-4 animate-spin" />
                </div>
              ) : null}
              <div ref={bottomSentinelRef} aria-hidden className="h-px" />
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
