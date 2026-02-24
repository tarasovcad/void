"use client";

import React from "react";
import {Button, buttonVariants} from "../shadcn/button";
import Image from "next/image";
import ThemeSwitch from "../other/ThemeSwitch";
import {cn} from "@/lib/utils";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/coss-ui/input-group";
import type {Session} from "better-auth";
import {Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger} from "@/components/coss-ui/menu";
import {useMutation} from "@tanstack/react-query";
import {authClient} from "@/components/utils/better-auth/auth-client";
import {toastManager} from "@/components/coss-ui/toast";

export type AppShellSession = {
  session: Session;
  user?: {
    email?: string | null;
  } | null;
} | null;

export function Header({session}: {session: AppShellSession}) {
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
