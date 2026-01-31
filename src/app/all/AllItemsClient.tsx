"use client";

import * as React from "react";
import {Select, SelectItem, SelectPopup, SelectTrigger} from "@/components/coss-ui/select";
import {cn} from "@/lib/utils";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import Link from "next/link";

export type AllItem = {
  id: string;
  kind: "website" | "article" | "video" | "image" | "social" | "other";
  title: string;
  domain: string;
  dateLabel: string;
  tags: string[];
  description?: string;
};

type ViewMode = "grid" | "list";

type TypeFilter = "all" | AllItem["kind"];
type SortMode = "recent" | "oldest" | "az";

function getTypeLabel(value: TypeFilter) {
  switch (value) {
    case "all":
      return "All Types";
    case "website":
      return "Websites";
    case "article":
      return "Articles";
    case "video":
      return "Videos";
    case "image":
      return "Images";
    case "social":
      return "Social";
    case "other":
      return "Other";
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
        <SelectItem value="article">Articles</SelectItem>
        <SelectItem value="video">Videos</SelectItem>
        <SelectItem value="image">Images</SelectItem>
        <SelectItem value="social">Social</SelectItem>
        <SelectItem value="other">Other</SelectItem>
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

function KindPill({kind}: {kind: AllItem["kind"]}) {
  return (
    <span className="bg-background text-foreground inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium shadow-xs">
      {kind}
    </span>
  );
}

function PlaceholderThumb() {
  return (
    <div className="text-muted-foreground absolute inset-0 grid place-items-center">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M4.75 4.75H15.25V15.25H4.75V4.75Z" stroke="currentColor" strokeWidth="1" />
        <path
          d="M6.5 12.5L8.25 10.75L10.25 12.75L12 11L13.5 12.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 8.25C8 8.66421 7.66421 9 7.25 9C6.83579 9 6.5 8.66421 6.5 8.25C6.5 7.83579 6.83579 7.5 7.25 7.5C7.66421 7.5 8 7.83579 8 8.25Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function ItemRow({item}: {item: AllItem}) {
  const meta = [item.domain, item.dateLabel].filter(Boolean).join(" – ");

  return (
    <Link
      href={`/all/${item.id}`}
      className={[
        "group flex w-full cursor-pointer gap-5 border-b px-6 py-5 text-left",
        "hover:bg-muted/40 focus-visible:bg-muted/40",
        "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
      ].join(" ")}>
      <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md border">
        <PlaceholderThumb />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate text-sm font-semibold">{item.title}</div>
        <div className="text-muted-foreground mt-0.5 text-xs">{meta}</div>
        {item.tags.length > 0 ? (
          <div className="text-muted-foreground mt-2 text-xs">
            {item.tags.map((t) => `#${t}`).join("  ")}
          </div>
        ) : null}
        {item.description ? (
          <div className="text-muted-foreground mt-2 line-clamp-2 text-xs">{item.description}</div>
        ) : null}
      </div>
    </Link>
  );
}

function GridCard({item}: {item: AllItem}) {
  const meta = [item.domain, item.dateLabel].filter(Boolean).join(" – ");

  return (
    <button
      type="button"
      className={[
        "bg-background w-full overflow-hidden rounded-md border text-left",
        "hover:bg-muted/30 focus-visible:bg-muted/30",
        "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
      ].join(" ")}>
      <div className="bg-muted relative aspect-16/10 w-full">
        <PlaceholderThumb />
        <div className="absolute bottom-3 left-3">
          <KindPill kind={item.kind} />
        </div>
      </div>

      <div className="p-4">
        <div className="text-foreground line-clamp-2 text-sm font-semibold">{item.title}</div>
        <div className="text-muted-foreground mt-1 text-xs">{meta}</div>
        {item.tags.length > 0 ? (
          <div className="text-muted-foreground mt-3 text-xs">
            {item.tags.map((t) => `#${t}`).join("  ")}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function AllItemsClient({items}: {items: AllItem[]}) {
  const [view, setView] = React.useState<ViewMode>("grid");
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>("all");
  const [sort, setSort] = React.useState<SortMode>("recent");

  const filteredAndSortedItems = React.useMemo(() => {
    const filtered = typeFilter === "all" ? items : items.filter((i) => i.kind === typeFilter);

    if (sort === "oldest") return [...filtered].reverse();
    if (sort === "az") return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered; // recent (as provided)
  }, [items, sort, typeFilter]);

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

      <div className="text-muted-foreground px-6 py-3 text-xs">
        {filteredAndSortedItems.length} items
      </div>
      <ScrollArea className="h-auto min-h-0 flex-1" scrollbarGutter scrollFade>
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-6 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedItems.map((item) => (
              <GridCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="border-t">
            {filteredAndSortedItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
