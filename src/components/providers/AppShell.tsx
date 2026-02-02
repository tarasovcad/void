"use client";

import React, {useState} from "react";
import {Button, buttonVariants} from "../shadcn/button";
import Image from "next/image";
import ThemeSwitch from "../other/ThemeSwitch";
import {cn} from "@/lib/utils";
import {usePathname, useRouter} from "next/navigation";
import Link from "next/link";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import type {Session} from "better-auth";
import {Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger} from "@/components/coss-ui/menu";
import {useMutation} from "@tanstack/react-query";
import {authClient} from "@/components/utils/better-auth/auth-client";
import {toastManager} from "@/components/coss-ui/toast";
import {addBookmark, type AddBookmarkResult} from "@/app/actions/bookmarks";
import {z} from "zod";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/coss-ui/dialog";
import {Input} from "@/components/coss-ui/input";

type AppShellSession = {
  session: Session;
  user?: {
    email?: string | null;
  } | null;
} | null;

const addItemUrlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .url("Please enter a valid URL")
  .refine((s) => {
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must start with http:// or https://");

function Header({session}: {session: AppShellSession}) {
  const email = session?.user?.email ?? null;
  const userInitial = email?.trim()?.[0]?.toUpperCase() ?? "?";
  const router = useRouter();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const res = await authClient.signOut();
      if (res.error) throw res.error;
      return res;
    },
    onSuccess: () => {
      toastManager.add({title: "Signed out", type: "success"});
      router.refresh();
      router.push("/login");
    },
    onError: (err) => {
      toastManager.add({
        title: "Failed to sign out",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    },
  });

  return (
    <div className="flex items-center justify-between border-b px-6 py-3.5">
      <div className="flex flex-1">
        <Image src="/logo/logo_light.svg" alt="Void Logo" width={24} height={24} />
      </div>
      <InputGroup className="w-full max-w-[340px]">
        <InputGroupInput
          aria-label="Search"
          placeholder="Search"
          type="search"
          autoComplete="off"
        />
        <InputGroupAddon>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </InputGroupAddon>
      </InputGroup>
      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeSwitch />

        {session ? (
          <Menu>
            <MenuTrigger
              aria-label="User menu"
              className={cn(buttonVariants({variant: "outline", size: "icon-sm"}), "rounded-full")}
              type="button">
              {userInitial}
            </MenuTrigger>
            <MenuPopup align="end" className="w-44">
              <MenuItem
                onClick={() => {
                  router.push("/favorites");
                }}>
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
                Favorites
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                variant="destructive"
                disabled={signOutMutation.isPending}
                onClick={() => signOutMutation.mutate()}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14 8C14 8.1326 13.9473 8.2598 13.8535 8.35353L10.8535 11.3535C10.6583 11.5488 10.3417 11.5488 10.1465 11.3535C9.9512 11.1583 9.9512 10.8417 10.1465 10.6465L12.2929 8.5H6C5.72386 8.5 5.5 8.27613 5.5 8C5.5 7.72387 5.72386 7.5 6 7.5H12.2929L10.1465 5.35355C9.9512 5.15829 9.9512 4.84171 10.1465 4.64645C10.3417 4.45118 10.6583 4.45118 10.8535 4.64645L13.8535 7.64647C13.9473 7.7402 14 7.8674 14 8Z"
                    fill="currentColor"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8 2.5C8 2.77614 7.77613 3 7.5 3H4.5C3.67157 3 3 3.67157 3 4.5V11.5C3 12.3284 3.67157 13 4.5 13H7.5C7.77613 13 8 13.2239 8 13.5C8 13.7761 7.77613 14 7.5 14H4.5C3.11929 14 2 12.8807 2 11.5V4.5C2 3.11929 3.11929 2 4.5 2H7.5C7.77613 2 8 2.22386 8 2.5Z"
                    fill="currentColor"
                  />
                </svg>
                Sign out
              </MenuItem>
            </MenuPopup>
          </Menu>
        ) : (
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

const NavItem = ({
  isActive,
  icon,
  label,
  href,
}: {
  isActive: boolean;
  icon?: React.ReactNode;
  label: string;
  href: string;
}) => {
  return (
    <Link
      href={href}
      className={cn(
        isActive
          ? "text-foreground bg-[#F0F0F0] dark:bg-[#181717]"
          : "text-secondary bg-transparent",
        "flex w-full items-center gap-2 rounded-md px-3 py-2",
        "hover:bg-muted hover:text-foreground",
      )}>
      <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
        {icon ?? null}
      </span>
      <span className="text-sm font-medium">{label}</span>
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

const COLLECTIONS = [
  {
    id: "project-alpha",
    label: "Project Alpha",
    href: "/collections/project-alpha",
  },
  {
    id: "design-inspiration",
    label: "Design Inspiration",
    href: "/collections/design-inspiration",
  },
  {
    id: "react-resources",
    label: "React Resources",
    href: "/collections/react-resources",
  },
] as const;

const TAGS = [
  {id: "design", label: "design", count: 156, href: "/tags/design"},
  {id: "react", label: "react", count: 89, href: "/tags/react"},
  {id: "animation", label: "animation", count: 67, href: "/tags/animation"},
  {id: "ui", label: "ui", count: 134, href: "/tags/ui"},
  {id: "components", label: "components", count: 45, href: "/tags/components"},
] as const;

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="h-full w-[224px] shrink-0 border-r">
      <div className="flex h-full flex-col justify-between overflow-y-auto">
        <div className="flex flex-col p-3">
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.label}
                href={item.href}
                isActive={item.href === pathname}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </div>

          <div className="bg-border my-4 h-px w-full" />

          <div className="text-muted-foreground px-4 pb-1 text-[11px] font-semibold tracking-wider">
            COLLECTIONS
          </div>
          <div className="flex flex-col gap-0.5">
            {COLLECTIONS.map((c) => (
              <NavItem
                key={c.id}
                href={c.href}
                isActive={pathname === c.href}
                icon={
                  <span aria-hidden="true" className="text-base leading-none">
                    ›
                  </span>
                }
                label={c.label}
              />
            ))}
          </div>

          <div className="bg-border my-4 h-px w-full" />

          <div className="text-muted-foreground px-4 pb-1 text-[11px] font-semibold tracking-wider">
            TAGS
          </div>
          <div className="flex flex-col gap-0.5">
            {TAGS.map((tag) => {
              const isActive = pathname === tag.href;
              return (
                <Link
                  key={tag.id}
                  href={tag.href}
                  className={cn(
                    isActive ? "text-foreground" : "text-secondary",
                    "flex w-full items-center justify-between rounded-md px-4 py-2 text-left",
                    "hover:bg-muted hover:text-foreground",
                  )}>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
                      #
                    </span>
                    {tag.label}
                  </span>
                  <span className="text-secondary text-sm tabular-nums">{tag.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div>
          <div className="bg-border my-4 h-px w-full" />
          <div className="p-3 pt-0">
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
      </div>
    </aside>
  );
};

const AppShell = ({children, session}: {children: React.ReactNode; session: AppShellSession}) => {
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemUrl, setAddItemUrl] = useState("");
  const [addItemUrlError, setAddItemUrlError] = useState<string | null>(null);
  const router = useRouter();

  const addItemMutation = useMutation<AddBookmarkResult, Error, {url: string}>({
    mutationFn: async (input) => {
      return await addBookmark(input);
    },
    onSuccess: (res) => {
      toastManager.add({
        title: "Bookmark added",
        description: res.url,
        type: "success",
      });
      setAddItemOpen(false);
      setAddItemUrl("");
      setAddItemUrlError(null);
      router.refresh();
    },
    onError: (err) => {
      toastManager.add({
        title: "Submit failed",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    },
  });

  const validateAddItemUrl = (rawUrl: string) => {
    const parsed = addItemUrlSchema.safeParse(rawUrl);
    if (!parsed.success) {
      setAddItemUrlError(parsed.error.issues[0]?.message ?? "Invalid URL");
      return null;
    }
    setAddItemUrlError(null);
    return parsed.data;
  };

  return (
    <main className="flex h-dvh min-h-screen flex-col">
      <Header session={session} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
      <div className="absolute right-6 bottom-6">
        <Dialog
          open={addItemOpen}
          onOpenChange={(open) => {
            setAddItemOpen(open);
            if (!open) {
              // Keep the URL, but clear validation UI when closing the dialog.
              setTimeout(() => {
                setAddItemUrlError(null);
              }, 1000);
            }
          }}>
          <Button
            variant="default"
            size="icon-lg"
            className="size-12 rounded-full"
            onClick={() => setAddItemOpen(true)}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 1C10.4142 1 10.75 1.33579 10.75 1.75V9.25H18.25C18.6642 9.25 19 9.5858 19 10C19 10.4142 18.6642 10.75 18.25 10.75H10.75V18.25C10.75 18.6642 10.4142 19 10 19C9.5858 19 9.25 18.6642 9.25 18.25V10.75H1.75C1.33579 10.75 1 10.4142 1 10C1 9.5858 1.33579 9.25 1.75 9.25H9.25V1.75C9.25 1.33579 9.5858 1 10 1Z"
                fill="currentColor"
              />
            </svg>
          </Button>

          <DialogPopup className="duration-250 ease-in-out data-ending-style:translate-y-2 data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:scale-98 data-starting-style:opacity-0">
            <DialogHeader>
              <DialogTitle>Add item</DialogTitle>
            </DialogHeader>

            <DialogPanel>
              <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const url = validateAddItemUrl(addItemUrl);
                  if (!url) return;
                  addItemMutation.mutate({url});
                }}>
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">URL</div>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={addItemUrl}
                    aria-invalid={!!addItemUrlError}
                    onChange={(e) => {
                      const next = e.target.value;
                      setAddItemUrl(next);
                      if (addItemUrlError) validateAddItemUrl(next);
                    }}
                  />
                  {addItemUrlError ? (
                    <div className="text-destructive text-sm" role="alert">
                      {addItemUrlError}
                    </div>
                  ) : null}
                </div>
              </form>
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button
                type="button"
                disabled={addItemMutation.isPending}
                onClick={() => {
                  const url = validateAddItemUrl(addItemUrl);
                  if (!url) return;
                  addItemMutation.mutate({url});
                }}>
                Submit
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </div>
    </main>
  );
};

export default AppShell;
