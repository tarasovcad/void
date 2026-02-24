"use client";

import React, {useEffect, useState} from "react";
import {buttonVariants} from "../shadcn/button";
import {cn} from "@/lib/utils";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import Link from "next/link";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger,
  MenuRadioGroup,
  MenuRadioItem,
  MenuCheckboxItem,
} from "@/components/coss-ui/menu";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {useQuery} from "@tanstack/react-query";
import {getTags} from "@/app/actions/tags";
import {getCollections} from "@/app/actions/collections";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/shadcn/context-menu";
import {AnimatePresence, motion} from "framer-motion";
import NumberFlow from "@number-flow/react";
import {useClipboardCopy} from "@/lib/useClipboardCopy";
import {SelectionActionBar} from "@/app/all/SelectionActionBar";
import {DeleteTagDialog} from "./DeleteTagDialog";
import type {Collection} from "@/app/actions/collections";

const NavItem = ({
  isActive,
  icon,
  label,
  href,
  className,
  iconSide = "left",
}: {
  isActive: boolean;
  icon?: React.ReactNode;
  label: string;
  href: string;
  className?: string;
  iconSide?: "left" | "right";
}) => {
  return (
    <Link
      href={href}
      className={cn(
        isActive
          ? "text-foreground bg-[#F0F0F0] dark:bg-[#181717]"
          : "text-secondary bg-transparent",
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        "hover:bg-muted hover:text-foreground",
        className,
      )}>
      {icon && iconSide === "left" && (
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
          {icon}
        </span>
      )}
      <span className="">{label}</span>
      {icon && iconSide === "right" && (
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
          {icon}
        </span>
      )}
    </Link>
  );
};

const NAV_ITEMS = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10.6479 2.65234C10.2397 2.44922 9.76035 2.44922 9.35219 2.65234L2.47786 6.07287C1.3963 6.61105 1.3963 8.16002 2.47786 8.69817L9.35219 12.1187C9.76035 12.3218 10.2397 12.3218 10.6479 12.1187L17.5222 8.69817C18.6038 8.16002 18.6038 6.61105 17.5222 6.07287L10.6479 2.65234Z"
          fill="currentColor"
        />
        <path
          d="M3.83808 10.625L2.47786 11.3018C1.3963 11.84 1.39629 13.3889 2.47786 13.9271L9.35218 17.3477C9.76035 17.5507 10.2397 17.5507 10.6479 17.3477L17.5222 13.9271C18.6038 13.3889 18.6038 11.84 17.5222 11.3018L16.1619 10.625L10.6479 13.3687C10.2397 13.5718 9.76035 13.5718 9.35218 13.3687L3.83808 10.625Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "All Items",
    href: "/all",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12.75 7.75C12.75 7.33579 12.4142 7 12 7C11.5858 7 11.25 7.33579 11.25 7.75V12C11.25 12.1989 11.329 12.3897 11.4697 12.5303L14.2197 15.2803C14.5126 15.5732 14.9874 15.5732 15.2803 15.2803C15.5732 14.9874 15.5732 14.5126 15.2803 14.2197L12.75 11.6893V7.75Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Recent",
    href: "/recent",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M11.3245 1.66454C10.7912 0.556155 9.20781 0.556155 8.67456 1.66454L6.86368 5.42816C6.83245 5.49308 6.76926 5.5397 6.69416 5.54952L2.52885 6.09405C1.30664 6.25383 0.806898 7.75978 1.71091 8.61084L4.75525 11.4769C4.80877 11.5273 4.83199 11.6 4.81892 11.67L4.05425 15.7654C3.82669 16.9843 5.11807 17.9028 6.1972 17.322L9.89373 15.3323C9.95956 15.2968 10.0395 15.2968 10.1053 15.3323L13.8018 17.322C14.881 17.9028 16.1724 16.9843 15.9448 15.7654L15.1801 11.67C15.1671 11.6 15.1903 11.5273 15.2438 11.4769L18.2881 8.61084C19.1921 7.75978 18.6924 6.25383 17.4702 6.09405L13.3049 5.54952C13.2298 5.5397 13.1666 5.49308 13.1354 5.42816L11.3245 1.66454Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Favorites",
    href: "/favorites",
  },
];

export type SidebarTags = {id: string; name: string; count: number}[];

export function Sidebar({
  tags: initialTags,
  collections: initialCollections,
  onCreateCollection,
}: {
  tags?: SidebarTags;
  collections?: Collection[];
  onCreateCollection?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [collectionsExpanded, setCollectionsExpanded] = useState(true);
  const [tagsSelectValue, setTagsSelectValue] = useState("all");
  const [tagSelectionMode, setTagSelectionMode] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagsToDelete, setTagsToDelete] = useState<{id: string; name: string}[]>([]);

  // Exit tag selection mode on Escape
  useEffect(() => {
    if (!tagSelectionMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTagSelectionMode(false);
        setSelectedTagIds(new Set());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tagSelectionMode]);

  const {copyText} = useClipboardCopy(2000, {toast: true});

  const {data: tags} = useQuery({
    queryKey: ["tags"],
    queryFn: async () => await getTags(),
    initialData: initialTags,
  });

  const {data: collections} = useQuery({
    queryKey: ["collections"],
    queryFn: async () => await getCollections(),
    initialData: initialCollections,
  });

  const selectedCount = selectedTagIds.size;
  const allSelected = tags?.length ? selectedCount === tags.length : false;

  const handleClearSelection = React.useCallback(() => {
    setSelectedTagIds(new Set());
    setTagSelectionMode(false);
  }, []);

  const handleSelectAll = React.useCallback(() => {
    if (allSelected) {
      setSelectedTagIds(new Set());
    } else if (tags) {
      setSelectedTagIds(new Set(tags.map((t) => t.id)));
    }
  }, [allSelected, tags]);

  const handleDeleteSelected = React.useCallback(() => {
    if (!tags) return;
    const selectedTags = tags.filter((t) => selectedTagIds.has(t.id));
    if (selectedTags.length === 0) return;
    setTagsToDelete(selectedTags);
    setDeleteDialogOpen(true);
  }, [selectedTagIds, tags]);

  const activeTag =
    searchParams.get("tag")?.trim().replace(/\s+/g, " ").toLowerCase() ??
    searchParams.get("tab")?.trim().replace(/\s+/g, " ").toLowerCase() ??
    null;

  return (
    <aside className="h-full w-[224px] shrink-0 border-r">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-3 pt-3">
            <div className="flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => {
                const isAllItemsWithFilter =
                  item.href === "/all" && pathname === "/all" && !!activeTag;
                const isActive = item.href === pathname && !isAllItemsWithFilter;

                return (
                  <NavItem
                    key={item.label}
                    href={item.href}
                    isActive={isActive}
                    icon={item.icon}
                    label={item.label}
                  />
                );
              })}
            </div>

            <div className="bg-border my-4 h-px w-full" />
          </div>

          <div className="min-h-0 flex-1">
            <ScrollArea className="**:data-[slot=scroll-area-scrollbar]:m-0.5">
              <div className="px-3 pe-2">
                <div
                  onClick={() => setCollectionsExpanded((prev) => !prev)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                    "text-muted-foreground hover:bg-muted hover:text-foreground",
                    "group/collections cursor-pointer text-[11px] font-semibold tracking-wider uppercase",
                    "h-[37px]",
                  )}>
                  <div className="flex items-center gap-0.5">
                    <span className="">Collections</span>
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center text-current transition-transform duration-200 ease-out",
                        collectionsExpanded ? "rotate-0" : "-rotate-90",
                      )}
                      aria-hidden>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="opacity-0 transition-opacity duration-150 ease-out group-hover/collections:opacity-100">
                        <path
                          d="M10.0879 5.1292C10.3156 4.90139 10.6849 4.90139 10.9127 5.1292C11.1405 5.35701 11.1405 5.72626 10.9127 5.95409L7.41274 9.45409C7.18489 9.68189 6.81564 9.68189 6.58785 9.45409L3.08784 5.95409C2.86004 5.72626 2.86004 5.35701 3.08784 5.1292C3.31565 4.90139 3.68491 4.90139 3.91272 5.1292L7.00027 8.21679L10.0879 5.1292Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Menu>
                      <MenuTrigger
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Collection options"
                        className={cn(
                          buttonVariants({variant: "ghost", size: "icon-xs"}),
                          "text-muted-foreground hover:bg-foreground/5",
                          "pointer-events-none opacity-0 transition-opacity duration-150 ease-out",
                          "group-hover/collections:pointer-events-auto group-hover/collections:opacity-100",
                        )}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M8.00033 9.33332C8.73671 9.33332 9.33366 8.73637 9.33366 7.99999C9.33366 7.26361 8.73671 6.66666 8.00033 6.66666C7.26395 6.66666 6.66699 7.26361 6.66699 7.99999C6.66699 8.73637 7.26395 9.33332 8.00033 9.33332Z"
                            fill="currentColor"
                          />
                          <path
                            d="M12.6663 9.33332C13.4027 9.33332 13.9997 8.73637 13.9997 7.99999C13.9997 7.26361 13.4027 6.66666 12.6663 6.66666C11.93 6.66666 11.333 7.26361 11.333 7.99999C11.333 8.73637 11.93 9.33332 12.6663 9.33332Z"
                            fill="currentColor"
                          />
                          <path
                            d="M3.33333 9.33332C4.06971 9.33332 4.66667 8.73637 4.66667 7.99999C4.66667 7.26361 4.06971 6.66666 3.33333 6.66666C2.59695 6.66666 2 7.26361 2 7.99999C2 8.73637 2.59695 9.33332 3.33333 9.33332Z"
                            fill="currentColor"
                          />
                        </svg>
                      </MenuTrigger>
                      <MenuPopup align="center" className="w-40">
                        <MenuCheckboxItem
                          checked={tagSelectionMode}
                          onCheckedChange={(checked) => {
                            setTagSelectionMode(checked);
                            if (!checked) setSelectedTagIds(new Set());
                            setTagMenuOpen(false);
                          }}>
                          Select
                        </MenuCheckboxItem>

                        <MenuSub disabled>
                          <MenuSubTrigger>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M6.08269 2.00513C6.44803 2.05079 6.7072 2.38399 6.66152 2.74933L6.42185 4.66664H10.4115L10.6718 2.58395C10.7175 2.21861 11.0507 1.95945 11.416 2.00513C11.7814 2.05079 12.0405 2.38399 11.9949 2.74933L11.7552 4.66664H13.3333C13.7015 4.66664 14 4.96512 14 5.33331C14 5.7015 13.7015 5.99997 13.3333 5.99997H11.5885L11.0885 9.99999H13.3333C13.7015 9.99999 14 10.2985 14 10.6667C14 11.0349 13.7015 11.3333 13.3333 11.3333H10.9219L10.6615 13.416C10.6159 13.7813 10.2827 14.0405 9.91733 13.9949C9.55193 13.9492 9.2928 13.616 9.33847 13.2506L9.57813 11.3333H5.58852L5.32819 13.416C5.28252 13.7813 4.94933 14.0405 4.58398 13.9949C4.21863 13.9492 3.95948 13.616 4.00515 13.2506L4.24481 11.3333H2.66667C2.29848 11.3333 2 11.0349 2 10.6667C2 10.2985 2.29848 9.99999 2.66667 9.99999H4.41148L4.91148 5.99997H2.66667C2.29848 5.99997 2 5.7015 2 5.33331C2 4.96512 2.29848 4.66664 2.66667 4.66664H5.07815L5.33848 2.58395C5.38415 2.21861 5.71734 1.95945 6.08269 2.00513ZM6.25519 5.99997L5.75519 9.99999H9.7448L10.2448 5.99997H6.25519Z"
                                fill="currentColor"
                              />
                            </svg>
                            Show
                          </MenuSubTrigger>
                          <MenuSubPopup className="w-44">
                            <MenuRadioGroup
                              value={tagsSelectValue}
                              onValueChange={(v) => setTagsSelectValue(String(v))}>
                              <MenuRadioItem value="5">5 items</MenuRadioItem>
                              <MenuRadioItem value="10">10 items</MenuRadioItem>
                              <MenuRadioItem value="15">15 items</MenuRadioItem>
                              <MenuRadioItem value="20">20 items</MenuRadioItem>
                              <MenuRadioItem value="50">50 items</MenuRadioItem>
                              <MenuRadioItem value="all">All items</MenuRadioItem>
                            </MenuRadioGroup>
                          </MenuSubPopup>
                        </MenuSub>
                        <MenuSeparator />
                        <MenuItem disabled>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M14.6663 8.00001C14.6663 4.31811 11.6815 1.33334 7.99967 1.33334C4.31777 1.33334 1.33301 4.31811 1.33301 8.00001C1.33301 11.6819 4.31777 14.6667 7.99967 14.6667C11.6815 14.6667 14.6663 11.6819 14.6663 8.00001ZM5.52827 6.86194C5.26792 7.12228 5.26792 7.54441 5.52827 7.80474C5.78862 8.06508 6.21073 8.06508 6.47108 7.80474L7.33301 6.94281V10.6667C7.33301 11.0349 7.63147 11.3333 7.99967 11.3333C8.36787 11.3333 8.66634 11.0349 8.66634 10.6667V6.94281L9.52827 7.80474C9.78861 8.06508 10.2107 8.06508 10.4711 7.80474C10.7314 7.54441 10.7314 7.12228 10.4711 6.86194L8.47107 4.86194C8.21074 4.60159 7.78861 4.60159 7.52827 4.86194L5.52827 6.86194Z"
                              fill="currentColor"
                            />
                          </svg>
                          Move Up
                        </MenuItem>
                        <MenuItem disabled>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="rotate-180">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M14.6663 8.00001C14.6663 4.31811 11.6815 1.33334 7.99967 1.33334C4.31777 1.33334 1.33301 4.31811 1.33301 8.00001C1.33301 11.6819 4.31777 14.6667 7.99967 14.6667C11.6815 14.6667 14.6663 11.6819 14.6663 8.00001ZM5.52827 6.86194C5.26792 7.12228 5.26792 7.54441 5.52827 7.80474C5.78862 8.06508 6.21073 8.06508 6.47108 7.80474L7.33301 6.94281V10.6667C7.33301 11.0349 7.63147 11.3333 7.99967 11.3333C8.36787 11.3333 8.66634 11.0349 8.66634 10.6667V6.94281L9.52827 7.80474C9.78861 8.06508 10.2107 8.06508 10.4711 7.80474C10.7314 7.54441 10.7314 7.12228 10.4711 6.86194L8.47107 4.86194C8.21074 4.60159 7.78861 4.60159 7.52827 4.86194L5.52827 6.86194Z"
                              fill="currentColor"
                            />
                          </svg>
                          Move Down
                        </MenuItem>
                      </MenuPopup>
                    </Menu>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateCollection?.();
                      }}
                      className={cn(
                        buttonVariants({variant: "ghost", size: "icon-xs"}),
                        "text-muted-foreground hover:bg-foreground/5",
                        "pointer-events-none opacity-0 transition-opacity duration-150 ease-out",
                        "group-hover/collections:pointer-events-auto group-hover/collections:opacity-100",
                      )}>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M7.5 1.875C7.84519 1.875 8.125 2.15482 8.125 2.5V6.875H12.5C12.8452 6.875 13.125 7.15481 13.125 7.5C13.125 7.84519 12.8452 8.125 12.5 8.125H8.125V12.5C8.125 12.8452 7.84519 13.125 7.5 13.125C7.15481 13.125 6.875 12.8452 6.875 12.5V8.125H2.5C2.15482 8.125 1.875 7.84519 1.875 7.5C1.875 7.15481 2.15482 6.875 2.5 6.875H6.875V2.5C6.875 2.15482 7.15481 1.875 7.5 1.875Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <AnimatePresence initial={false}>
                    {collectionsExpanded &&
                      collections?.map((c) => (
                        <motion.div
                          key={c.id}
                          initial={false}
                          animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
                          exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
                          transition={{duration: 0.25, ease: "easeOut"}}>
                          <NavItem
                            href={`/all?collection=${c.id}`}
                            isActive={
                              pathname === "/all" && searchParams.get("collection") === c.id
                            }
                            icon={
                              <span aria-hidden="true" className="text-base leading-none">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M8.1801 5.20811C8.42024 4.93063 8.80956 4.93063 9.04971 5.20811L11.4597 7.99274C12.1801 8.8252 12.1801 10.1748 11.4597 11.0073L9.04971 13.7919C8.80956 14.0694 8.42024 14.0694 8.1801 13.7919C7.93997 13.5144 7.93997 13.0646 8.1801 12.7871L10.59 10.0024C10.8302 9.72492 10.8302 9.2751 10.59 8.99762L8.1801 6.21295C7.93997 5.93547 7.93997 5.48558 8.1801 5.20811Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                            }
                            label={c.name}
                          />
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>

                <div className="bg-border my-4 h-px w-full" />

                <div
                  onClick={() => setTagsExpanded((prev) => !prev)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium",
                    "text-muted-foreground hover:bg-muted hover:text-foreground",
                    "group/tags cursor-pointer text-[11px] font-semibold tracking-wider uppercase",
                    "h-[37px]",
                  )}>
                  <div className="flex items-center gap-0.5">
                    <span className="">TAGS</span>
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center text-current transition-transform duration-200 ease-out",
                        tagsExpanded ? "rotate-0" : "-rotate-90",
                      )}
                      aria-hidden>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="opacity-0 transition-opacity duration-150 ease-out group-hover/tags:opacity-100">
                        <path
                          d="M10.0879 5.1292C10.3156 4.90139 10.6849 4.90139 10.9127 5.1292C11.1405 5.35701 11.1405 5.72626 10.9127 5.95409L7.41274 9.45409C7.18489 9.68189 6.81564 9.68189 6.58785 9.45409L3.08784 5.95409C2.86004 5.72626 2.86004 5.35701 3.08784 5.1292C3.31565 4.90139 3.68491 4.90139 3.91272 5.1292L7.00027 8.21679L10.0879 5.1292Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </div>

                  <Menu open={tagMenuOpen} onOpenChange={setTagMenuOpen}>
                    <MenuTrigger
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Tag options"
                      className={cn(
                        buttonVariants({variant: "ghost", size: "icon-xs"}),
                        "text-muted-foreground hover:bg-foreground/5",
                        "pointer-events-none opacity-0 transition-opacity duration-150 ease-out",
                        "group-hover/tags:pointer-events-auto group-hover/tags:opacity-100",
                      )}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M8.00033 9.33332C8.73671 9.33332 9.33366 8.73637 9.33366 7.99999C9.33366 7.26361 8.73671 6.66666 8.00033 6.66666C7.26395 6.66666 6.66699 7.26361 6.66699 7.99999C6.66699 8.73637 7.26395 9.33332 8.00033 9.33332Z"
                          fill="currentColor"
                        />
                        <path
                          d="M12.6663 9.33332C13.4027 9.33332 13.9997 8.73637 13.9997 7.99999C13.9997 7.26361 13.4027 6.66666 12.6663 6.66666C11.93 6.66666 11.333 7.26361 11.333 7.99999C11.333 8.73637 11.93 9.33332 12.6663 9.33332Z"
                          fill="currentColor"
                        />
                        <path
                          d="M3.33333 9.33332C4.06971 9.33332 4.66667 8.73637 4.66667 7.99999C4.66667 7.26361 4.06971 6.66666 3.33333 6.66666C2.59695 6.66666 2 7.26361 2 7.99999C2 8.73637 2.59695 9.33332 3.33333 9.33332Z"
                          fill="currentColor"
                        />
                      </svg>
                    </MenuTrigger>
                    <MenuPopup align="center" className="w-40">
                      <MenuCheckboxItem
                        checked={tagSelectionMode}
                        onCheckedChange={(checked) => {
                          setTagSelectionMode(checked);
                          if (!checked) setSelectedTagIds(new Set());
                          setTagMenuOpen(false);
                        }}>
                        Select
                      </MenuCheckboxItem>

                      <MenuSub disabled>
                        <MenuSubTrigger>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M6.08269 2.00513C6.44803 2.05079 6.7072 2.38399 6.66152 2.74933L6.42185 4.66664H10.4115L10.6718 2.58395C10.7175 2.21861 11.0507 1.95945 11.416 2.00513C11.7814 2.05079 12.0405 2.38399 11.9949 2.74933L11.7552 4.66664H13.3333C13.7015 4.66664 14 4.96512 14 5.33331C14 5.7015 13.7015 5.99997 13.3333 5.99997H11.5885L11.0885 9.99999H13.3333C13.7015 9.99999 14 10.2985 14 10.6667C14 11.0349 13.7015 11.3333 13.3333 11.3333H10.9219L10.6615 13.416C10.6159 13.7813 10.2827 14.0405 9.91733 13.9949C9.55193 13.9492 9.2928 13.616 9.33847 13.2506L9.57813 11.3333H5.58852L5.32819 13.416C5.28252 13.7813 4.94933 14.0405 4.58398 13.9949C4.21863 13.9492 3.95948 13.616 4.00515 13.2506L4.24481 11.3333H2.66667C2.29848 11.3333 2 11.0349 2 10.6667C2 10.2985 2.29848 9.99999 2.66667 9.99999H4.41148L4.91148 5.99997H2.66667C2.29848 5.99997 2 5.7015 2 5.33331C2 4.96512 2.29848 4.66664 2.66667 4.66664H5.07815L5.33848 2.58395C5.38415 2.21861 5.71734 1.95945 6.08269 2.00513ZM6.25519 5.99997L5.75519 9.99999H9.7448L10.2448 5.99997H6.25519Z"
                              fill="currentColor"
                            />
                          </svg>
                          Show
                        </MenuSubTrigger>
                        <MenuSubPopup className="w-44">
                          <MenuRadioGroup
                            value={tagsSelectValue}
                            onValueChange={(v) => setTagsSelectValue(String(v))}>
                            <MenuRadioItem value="5">5 items</MenuRadioItem>
                            <MenuRadioItem value="10">10 items</MenuRadioItem>
                            <MenuRadioItem value="15">15 items</MenuRadioItem>
                            <MenuRadioItem value="20">20 items</MenuRadioItem>
                            <MenuRadioItem value="50">50 items</MenuRadioItem>
                            <MenuRadioItem value="all">All items</MenuRadioItem>
                          </MenuRadioGroup>
                        </MenuSubPopup>
                      </MenuSub>
                      <MenuSeparator />
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M14.6663 8.00001C14.6663 4.31811 11.6815 1.33334 7.99967 1.33334C4.31777 1.33334 1.33301 4.31811 1.33301 8.00001C1.33301 11.6819 4.31777 14.6667 7.99967 14.6667C11.6815 14.6667 14.6663 11.6819 14.6663 8.00001ZM5.52827 6.86194C5.26792 7.12228 5.26792 7.54441 5.52827 7.80474C5.78862 8.06508 6.21073 8.06508 6.47108 7.80474L7.33301 6.94281V10.6667C7.33301 11.0349 7.63147 11.3333 7.99967 11.3333C8.36787 11.3333 8.66634 11.0349 8.66634 10.6667V6.94281L9.52827 7.80474C9.78861 8.06508 10.2107 8.06508 10.4711 7.80474C10.7314 7.54441 10.7314 7.12228 10.4711 6.86194L8.47107 4.86194C8.21074 4.60159 7.78861 4.60159 7.52827 4.86194L5.52827 6.86194Z"
                            fill="currentColor"
                          />
                        </svg>
                        Move Up
                      </MenuItem>
                      <MenuItem disabled>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="rotate-180">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M14.6663 8.00001C14.6663 4.31811 11.6815 1.33334 7.99967 1.33334C4.31777 1.33334 1.33301 4.31811 1.33301 8.00001C1.33301 11.6819 4.31777 14.6667 7.99967 14.6667C11.6815 14.6667 14.6663 11.6819 14.6663 8.00001ZM5.52827 6.86194C5.26792 7.12228 5.26792 7.54441 5.52827 7.80474C5.78862 8.06508 6.21073 8.06508 6.47108 7.80474L7.33301 6.94281V10.6667C7.33301 11.0349 7.63147 11.3333 7.99967 11.3333C8.36787 11.3333 8.66634 11.0349 8.66634 10.6667V6.94281L9.52827 7.80474C9.78861 8.06508 10.2107 8.06508 10.4711 7.80474C10.7314 7.54441 10.7314 7.12228 10.4711 6.86194L8.47107 4.86194C8.21074 4.60159 7.78861 4.60159 7.52827 4.86194L5.52827 6.86194Z"
                            fill="currentColor"
                          />
                        </svg>
                        Move Down
                      </MenuItem>
                    </MenuPopup>
                  </Menu>
                </div>
                <div className="flex flex-col gap-0.5 pb-2">
                  <AnimatePresence initial={false}>
                    {tagsExpanded &&
                      tags?.map((tag, index) => {
                        const isActive =
                          pathname === "/all" &&
                          activeTag != null &&
                          activeTag === tag.name.toLowerCase();
                        return (
                          <motion.div
                            key={tag.id}
                            initial={false}
                            animate={{opacity: 1, height: "auto", filter: "blur(0px)"}}
                            exit={{opacity: 0, height: 0, filter: "blur(8px)"}}
                            transition={{duration: 0.25, ease: "easeOut"}}>
                            <ContextMenu>
                              <ContextMenuTrigger
                                onClick={() => {
                                  if (tagSelectionMode) {
                                    setSelectedTagIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(tag.id)) next.delete(tag.id);
                                      else next.add(tag.id);
                                      return next;
                                    });
                                    return;
                                  }
                                  router.push(`/all?tag=${encodeURIComponent(tag.name)}`);
                                }}
                                className={cn(
                                  isActive
                                    ? "text-foreground bg-[#F0F0F0] dark:bg-[#181717]"
                                    : "text-secondary bg-transparent",
                                  "flex w-full items-center gap-2 rounded-md px-3 py-2",
                                  "hover:bg-muted hover:text-foreground",
                                  "cursor-pointer justify-between",
                                )}>
                                <div className="flex items-center">
                                  <div
                                    className={cn(
                                      "grid shrink-0 items-center transition-[grid-template-columns,opacity] duration-200 ease-out",
                                      tagSelectionMode
                                        ? "grid-cols-[1fr] opacity-100"
                                        : "grid-cols-[0fr] opacity-0",
                                    )}
                                    style={{
                                      transitionDelay: tagSelectionMode
                                        ? `${Math.min(index * 20, 120)}ms`
                                        : "0ms",
                                    }}>
                                    <div className="min-w-0 overflow-hidden">
                                      <div className="pr-2">
                                        <Checkbox
                                          checked={selectedTagIds.has(tag.id)}
                                          onCheckedChange={(checked) => {
                                            setSelectedTagIds((prev) => {
                                              const next = new Set(prev);
                                              if (checked) next.add(tag.id);
                                              else next.delete(tag.id);
                                              return next;
                                            });
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <span className="flex items-center gap-0.5 text-sm font-medium">
                                    <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
                                      #
                                    </span>
                                    {tag.name}
                                  </span>
                                </div>
                                <span className="text-secondary text-sm tabular-nums">
                                  <NumberFlow value={tag.count} />
                                </span>
                              </ContextMenuTrigger>

                              <ContextMenuContent>
                                <Link href={`/all?tag=${encodeURIComponent(tag.name)}`}>
                                  <ContextMenuItem>
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 16 16"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M8.00039 2.66667C10.4959 2.66669 12.9312 4.10717 14.6101 6.8632C15.0346 7.56 15.0346 8.44 14.6101 9.1368C12.9312 11.8929 10.4959 13.3333 8.00039 13.3333C5.50483 13.3333 3.06951 11.8928 1.39061 9.13673C0.966152 8.43993 0.966146 7.55993 1.39062 6.86313C3.06951 4.10709 5.50483 2.66665 8.00039 2.66667ZM5.5837 8C5.5837 6.66531 6.66568 5.58333 8.00039 5.58333C9.33506 5.58333 10.4171 6.66531 10.4171 8C10.4171 9.33467 9.33506 10.4167 8.00039 10.4167C6.66568 10.4167 5.5837 9.33467 5.5837 8Z"
                                        fill="currentColor"
                                      />
                                    </svg>
                                    Open
                                  </ContextMenuItem>
                                </Link>

                                <ContextMenuItem
                                  onClick={() => console.log("Rename tag:", tag.name)}>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M2.66699 3.83333C2.66699 2.45262 3.78628 1.33333 5.16699 1.33333H10.8337C12.2144 1.33333 13.3337 2.45262 13.3337 3.83333V8.44493C12.4141 8.11113 11.3438 8.31293 10.6063 9.0504L8.10633 11.5504C7.82506 11.8317 7.66699 12.2133 7.66699 12.6111V14.1666C7.66699 14.3419 7.69706 14.5103 7.75239 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V3.83333ZM5.33366 4.5C5.33366 4.22386 5.55752 4 5.83366 4H10.167C10.4431 4 10.667 4.22386 10.667 4.5C10.667 4.77614 10.4431 5 10.167 5H5.83366C5.55752 5 5.33366 4.77614 5.33366 4.5ZM5.83366 6.66667C5.55752 6.66667 5.33366 6.89053 5.33366 7.16667C5.33366 7.4428 5.55752 7.66667 5.83366 7.66667H7.50033C7.77646 7.66667 8.00033 7.4428 8.00033 7.16667C8.00033 6.89053 7.77646 6.66667 7.50033 6.66667H5.83366Z"
                                      fill="currentColor"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M12.869 10.4646C12.6347 10.2303 12.2549 10.2303 12.0205 10.4646L9.66699 12.8182V13.6666H10.5155L12.869 11.3131C13.1033 11.0788 13.1033 10.6989 12.869 10.4646ZM11.3135 9.75753C11.9383 9.13267 12.9513 9.13267 13.5761 9.75753C14.2009 10.3823 14.2009 11.3953 13.5761 12.0202L11.0761 14.5202C10.9823 14.6139 10.8551 14.6666 10.7225 14.6666H9.16699C8.89086 14.6666 8.66699 14.4427 8.66699 14.1666V12.6111C8.66699 12.4785 8.71966 12.3513 8.81346 12.2575L11.3135 9.75753Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                  Rename
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => void copyText(tag.name, tag.id)}>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M10.3787 2.66667H10.8337C12.2144 2.66667 13.3337 3.78595 13.3337 5.16667V12.1667C13.3337 13.5474 12.2144 14.6667 10.8337 14.6667H5.16699C3.78628 14.6667 2.66699 13.5474 2.66699 12.1667V5.16667C2.66699 3.78595 3.78628 2.66667 5.16699 2.66667H5.62201C6.04117 1.8737 6.87433 1.33333 7.83366 1.33333H8.16699C9.12633 1.33333 9.95946 1.8737 10.3787 2.66667ZM9.66699 3.83333C9.66699 3.00491 8.99539 2.33333 8.16699 2.33333H7.83366C7.00526 2.33333 6.33366 3.00491 6.33366 3.83333V4.16667C6.33366 4.25871 6.40828 4.33333 6.50033 4.33333H9.50033C9.59239 4.33333 9.66699 4.25871 9.66699 4.16667V3.83333Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                  Copy
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  onClick={() => console.log("Pin / Unpin tag:", tag.name)}>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M6.83366 1.33334C5.45295 1.33334 4.33366 2.45262 4.33366 3.83334V4.66464C4.33366 5.81391 3.87711 6.91614 3.06446 7.72874L2.81344 7.9798C2.71967 8.07354 2.66699 8.20074 2.66699 8.33334V10.1667C2.66699 10.2993 2.71967 10.4265 2.81344 10.5202C2.90721 10.614 3.03439 10.6667 3.16699 10.6667H7.50033V14.1667C7.50033 14.4428 7.72419 14.6667 8.00033 14.6667C8.27646 14.6667 8.50033 14.4428 8.50033 14.1667V10.6667H12.8337C13.1098 10.6667 13.3337 10.4428 13.3337 10.1667V8.33334C13.3337 8.20074 13.281 8.07354 13.1872 7.9798L12.9362 7.72874C12.1235 6.91614 11.667 5.81391 11.667 4.66464V3.83334C11.667 2.45262 10.5477 1.33334 9.16699 1.33334H6.83366Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                  Pin
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => console.log("Hide / Unhide tag:", tag.name)}>
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M2.18721 1.47979C1.99195 1.28453 1.67536 1.28453 1.4801 1.47979C1.28484 1.67505 1.28484 1.99164 1.4801 2.1869L3.59188 4.29867C2.69585 5.02201 1.88712 5.98015 1.21211 7.16474C0.916803 7.68301 0.918103 8.31881 1.21286 8.83594C2.49818 11.0909 4.27003 12.526 6.19662 13.0779C8.00092 13.5949 9.89826 13.3238 11.5804 12.2872L13.8135 14.5202C14.0087 14.7155 14.3253 14.7155 14.5205 14.5202C14.7158 14.3249 14.7158 14.0084 14.5205 13.8131L2.18721 1.47979ZM9.49866 10.2055L8.77092 9.47774C8.54032 9.59834 8.27812 9.66634 7.99972 9.66634C7.07926 9.66634 6.33306 8.92014 6.33306 7.99968C6.33306 7.72128 6.4011 7.45908 6.5217 7.22848L5.79398 6.50077C5.50332 6.92781 5.33306 7.44414 5.33306 7.99968C5.33306 9.47248 6.52698 10.6663 7.99972 10.6663C8.55526 10.6663 9.07159 10.4961 9.49866 10.2055Z"
                                      fill="currentColor"
                                    />
                                    <path
                                      d="M13.1489 11.0277C13.6793 10.489 14.1704 9.85792 14.6097 9.13679C15.0341 8.43999 15.0341 7.55999 14.6097 6.86319C12.9307 4.10716 10.4955 2.66668 7.99994 2.66666C7.09694 2.66665 6.20188 2.85523 5.34766 3.22648L13.1489 11.0277Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                  Hide
                                </ContextMenuItem>
                                <ContextMenuSeparator />

                                <ContextMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    setTagsToDelete([{id: tag.id, name: tag.name}]);
                                    setDeleteDialogOpen(true);
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
                                      d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334ZM6.66699 6.50001C6.94313 6.50001 7.16699 6.72387 7.16699 7.00001V10.8333C7.16699 11.1095 6.94313 11.3333 6.66699 11.3333C6.39085 11.3333 6.16699 11.1095 6.16699 10.8333V7.00001C6.16699 6.72387 6.39085 6.50001 6.66699 6.50001ZM9.33366 6.50001C9.60979 6.50001 9.83366 6.72387 9.83366 7.00001V10.8333C9.83366 11.1095 9.60979 11.3333 9.33366 11.3333C9.05753 11.3333 8.83366 11.1095 8.83366 10.8333V7.00001C8.83366 6.72387 9.05753 6.50001 9.33366 6.50001Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                  Delete
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
        <div className="shrink-0 p-3 pt-0">
          <div className="bg-border my-4 h-px w-full" />
          <NavItem
            href="/settings"
            isActive={pathname === "/settings"}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.899 1.79361C11.5904 1.66675 11.1992 1.66675 10.4167 1.66675C9.63416 1.66675 9.24291 1.66675 8.93433 1.79361C8.52283 1.96277 8.19591 2.28723 8.02546 2.69561C7.94766 2.88203 7.91721 3.09883 7.90529 3.41507C7.88778 3.87981 7.64763 4.30999 7.24181 4.54252C6.83598 4.77505 6.34053 4.76636 5.92624 4.54905C5.64431 4.40116 5.43991 4.31893 5.23832 4.2926C4.79674 4.2349 4.35015 4.35366 3.9968 4.62275C3.73178 4.82456 3.53616 5.16083 3.14491 5.83336C2.75367 6.50589 2.55806 6.84215 2.51446 7.17084C2.45631 7.60908 2.57598 8.0523 2.84712 8.403C2.97088 8.56308 3.14481 8.69758 3.41475 8.86591C3.81159 9.11341 4.06693 9.535 4.06691 10.0001C4.06688 10.4652 3.81155 10.8867 3.41475 11.1341C3.14476 11.3025 2.97081 11.4371 2.84704 11.5972C2.5759 11.9478 2.45624 12.391 2.51437 12.8292C2.55797 13.1579 2.7536 13.4942 3.14483 14.1667C3.53607 14.8392 3.7317 15.1756 3.99671 15.3773C4.35006 15.6464 4.79666 15.7652 5.23824 15.7075C5.43981 15.6812 5.64421 15.5989 5.92611 15.4511C6.34043 15.2337 6.83591 15.2251 7.24176 15.4576C7.64761 15.6902 7.88777 16.1203 7.90529 16.5852C7.91721 16.9013 7.94766 17.1182 8.02546 17.3046C8.19591 17.7129 8.52283 18.0374 8.93433 18.2066C9.24291 18.3334 9.63416 18.3334 10.4167 18.3334C11.1992 18.3334 11.5904 18.3334 11.899 18.2066C12.3105 18.0374 12.6374 17.7129 12.8078 17.3046C12.8857 17.1182 12.9162 16.9013 12.9281 16.5851C12.9456 16.1203 13.1857 15.6902 13.5915 15.4576C13.9973 15.225 14.4928 15.2337 14.9072 15.4511C15.1891 15.5989 15.3934 15.6811 15.595 15.7074C16.0366 15.7652 16.4832 15.6464 16.8365 15.3773C17.1016 15.1755 17.2972 14.8392 17.6884 14.1667C18.0797 13.4942 18.2752 13.1579 18.3189 12.8292C18.377 12.391 18.2573 11.9477 17.9862 11.5971C17.8624 11.437 17.6885 11.3024 17.4185 11.1341C17.0217 10.8867 16.7664 10.4651 16.7664 10C16.7664 9.53491 17.0217 9.1135 17.4185 8.86608C17.6886 8.69766 17.8625 8.56316 17.9863 8.403C18.2574 8.05236 18.3771 7.60914 18.319 7.17089C18.2753 6.84221 18.0797 6.50594 17.6885 5.83341C17.2972 5.16089 17.1017 4.82462 16.8366 4.62281C16.4832 4.35371 16.0367 4.23496 15.5951 4.29266C15.3935 4.31899 15.1891 4.40121 14.9072 4.54908C14.4929 4.76641 13.9974 4.7751 13.5916 4.54255C13.1857 4.31001 12.9456 3.8798 12.928 3.41503C12.9161 3.09881 12.8857 2.88202 12.8078 2.69561C12.6374 2.28723 12.3105 1.96277 11.899 1.79361ZM10.4167 12.5001C11.8079 12.5001 12.9357 11.3808 12.9357 10.0001C12.9357 8.61933 11.8079 7.50008 10.4167 7.50008C9.02541 7.50008 7.89763 8.61933 7.89763 10.0001C7.89763 11.3808 9.02541 12.5001 10.4167 12.5001Z"
                  fill="currentColor"
                />
              </svg>
            }
            label="Settings"
          />
        </div>
      </div>

      <DeleteTagDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tags={tagsToDelete}
        onDeleted={handleClearSelection}
      />

      <SelectionActionBar
        visible={tagSelectionMode && selectedCount > 0}
        selectedCount={selectedCount}
        allSelected={allSelected}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onDelete={handleDeleteSelected}
        displayArchive={false}
        displayFavorite={false}
        displayCopy={false}
      />
    </aside>
  );
}
