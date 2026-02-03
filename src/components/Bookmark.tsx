"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {formatDateAbsolute} from "@/lib/formatDate";
import {useEffect, useState} from "react";
import {cn} from "@/lib/utils";

export type Bookmark = {
  id: string;
  kind: "website" | "article" | "video" | "image" | "social" | "other";
  title: string;
  description: string;
  created_at: string;
  url: string;
  user_id: string;
  // tags: string[];
};

function BookmarkHoverActions({
  className,
  onOptions,
  onDelete,
}: {
  className?: string;
  onOptions?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const baseButtonClassName = cn(
    "pointer-events-auto inline-flex size-8 items-center justify-center rounded-md border",
    "bg-background text-foreground/90",
    "hover:bg-muted focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
  );

  const stopNav = (e: React.MouseEvent<HTMLButtonElement>) => {
    // These buttons can live inside a <Link>; prevent navigation when clicked.
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-2 right-2 z-10 flex items-center gap-1",
        "opacity-0 transition-opacity duration-75 ease-out",
        "group-hover:pointer-events-auto group-hover:opacity-100",
        "group-focus-visible:pointer-events-auto group-focus-visible:opacity-100",
        className,
      )}>
      <button
        type="button"
        aria-label="Delete"
        className={baseButtonClassName}
        onClick={(e) => {
          stopNav(e);
          onDelete?.(e);
        }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.24552 3.33317H2.1665C1.89036 3.33317 1.6665 3.55703 1.6665 3.83317C1.6665 4.10931 1.89036 4.33317 2.1665 4.33317H2.66648C2.6665 4.34477 2.66691 4.35645 2.66773 4.36819L3.22761 12.3416C3.31956 13.6512 4.40871 14.6665 5.72147 14.6665H10.2782C11.591 14.6665 12.6801 13.6512 12.772 12.3416L13.332 4.36819C13.3328 4.35645 13.3332 4.34477 13.3332 4.33317H13.8332C14.1093 4.33317 14.3332 4.10931 14.3332 3.83317C14.3332 3.55703 14.1093 3.33317 13.8332 3.33317H10.7542C10.4542 2.08988 9.33524 1.1665 7.9999 1.1665C6.66455 1.1665 5.5455 2.08988 5.24552 3.33317ZM6.2914 3.33317H9.70837C9.4417 2.65039 8.77704 2.1665 7.9999 2.1665C7.2227 2.1665 6.55804 2.65039 6.2914 3.33317ZM6.6665 6.49984C6.94264 6.49984 7.1665 6.7237 7.1665 6.99984V10.8332C7.1665 11.1093 6.94264 11.3332 6.6665 11.3332C6.39036 11.3332 6.1665 11.1093 6.1665 10.8332V6.99984C6.1665 6.7237 6.39036 6.49984 6.6665 6.49984ZM9.33317 6.49984C9.6093 6.49984 9.83317 6.7237 9.83317 6.99984V10.8332C9.83317 11.1093 9.6093 11.3332 9.33317 11.3332C9.05704 11.3332 8.83317 11.1093 8.83317 10.8332V6.99984C8.83317 6.7237 9.05704 6.49984 9.33317 6.49984Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Options"
        className={baseButtonClassName}
        onClick={(e) => {
          stopNav(e);
          onOptions?.(e);
        }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.50016 6.8335C1.85583 6.8335 1.3335 7.35583 1.3335 8.00016C1.3335 8.6445 1.85583 9.16683 2.50016 9.16683C3.1445 9.16683 3.66683 8.6445 3.66683 8.00016C3.66683 7.35583 3.1445 6.8335 2.50016 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M8.00016 6.8335C7.35583 6.8335 6.8335 7.35583 6.8335 8.00016C6.8335 8.6445 7.35583 9.16683 8.00016 9.16683C8.6445 9.16683 9.16683 8.6445 9.16683 8.00016C9.16683 7.35583 8.6445 6.8335 8.00016 6.8335Z"
            fill="currentColor"
          />
          <path
            d="M13.5002 6.8335C12.8558 6.8335 12.3335 7.35583 12.3335 8.00016C12.3335 8.6445 12.8558 9.16683 13.5002 9.16683C14.1445 9.16683 14.6668 8.6445 14.6668 8.00016C14.6668 7.35583 14.1445 6.8335 13.5002 6.8335Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

const PlaceholderThumb = ({bookmark_id}: {bookmark_id: string}) => {
  const BASE_SRC = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bookmark-favicons/${bookmark_id}/favicon.png`;
  const MAX_RETRIES = 12; // ~24s at 2s interval
  const RETRY_MS = 2000;

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  // If the image 404s (still uploading), retry with a cache-busting query param.
  useEffect(() => {
    if (status !== "error") return;
    if (attempt >= MAX_RETRIES) return;

    const t = window.setTimeout(() => {
      setAttempt((a) => a + 1);
      setStatus("loading");
    }, RETRY_MS);

    return () => window.clearTimeout(t);
  }, [attempt, status]);

  return (
    <div className="absolute inset-0 grid grid-cols-1 grid-rows-1 place-items-center">
      {status !== "loaded" ? (
        <div className="text-muted-foreground col-start-1 row-start-1">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true">
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
      ) : null}

      {/* Cache-busted favicon attempts. Keep hidden until loaded to avoid alt text flashes. */}
      <Image
        src={`${BASE_SRC}?v=${attempt}`}
        alt=""
        width={24}
        height={24}
        className={[
          "col-start-1 row-start-1 h-full max-h-6 w-full max-w-6 object-cover",
          status === "loaded" ? "opacity-100" : "opacity-0",
        ].join(" ")}
        unoptimized
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </div>
  );
};

export const ItemRow = ({item}: {item: Bookmark}) => {
  // const meta = [item.domain, item.dateLabel].filter(Boolean).join(" – ");
  // const meta = [item.domain, item.dateLabel].filter(Boolean).join(" – ");

  return (
    <Link
      href={`/all/${item.id}`}
      className={[
        "group relative flex w-full cursor-pointer gap-5 border-b px-6 py-5 pr-16 text-left",
        "hover:bg-muted/40 focus-visible:bg-muted/40",
        "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
      ].join(" ")}>
      <BookmarkHoverActions className="top-4 right-4" />
      <div className="relative size-9 shrink-0 overflow-hidden rounded-md border">
        <PlaceholderThumb bookmark_id={item.id} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate text-sm font-semibold">{item.title}</div>
        <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1 text-xs whitespace-nowrap">
          <span className="min-w-0 truncate">{item.url}</span>
          <span className="shrink-0">-</span>
          <span className="shrink-0">{formatDateAbsolute(item.created_at)}</span>
        </div>
        {/* {item.tags.length > 0 ? (
          <div className="text-muted-foreground mt-2 text-xs">
            {item.tags.map((t) => `#${t}`).join("  ")}
          </div>
        ) : null} */}
        {item.description ? (
          <div className="text-muted-foreground mt-2 line-clamp-2 text-xs">{item.description}</div>
        ) : null}
      </div>
    </Link>
  );
};

export const GridCard = ({item}: {item: Bookmark}) => {
  // const meta = [item.domain, item.dateLabel].filter(Boolean).join(" – ");

  return (
    <Link
      href={item.url}
      className={[
        "group bg-background relative w-full overflow-hidden rounded-md border text-left",
        "hover:bg-muted/30 focus-visible:bg-muted/30",
        "focus-visible:ring-ring/50 hover:border-foreground/30 outline-none focus-visible:ring-2",
      ].join(" ")}>
      <div className="bg-muted relative aspect-16/10 w-full">
        <BookmarkHoverActions />

        <Image
          src={`https://jvnaqdowfvgjeiiynebq.supabase.co/storage/v1/object/public/bookmark-previews/${item.id}/preview.png`}
          alt={item.title}
          fill
          className="rounded-md object-cover p-2"
        />
      </div>

      <div className="min-h-[92px] p-4">
        <div className="text-foreground line-clamp-2 text-sm font-semibold">{item.title}</div>
        <div className="text-muted-foreground mt-1 flex min-w-0 items-center gap-1 text-xs whitespace-nowrap">
          <span className="min-w-0 truncate">{item.url}</span>
          <span className="shrink-0">-</span>
          <span className="shrink-0">{formatDateAbsolute(item.created_at)}</span>
        </div>
        {/* {item.tags.length > 0 ? (
          <div className="text-muted-foreground mt-3 text-xs">
            {item.tags.map((t) => `#${t}`).join("  ")}
          </div>
        ) : null} */}
      </div>
    </Link>
  );
};
