import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import React from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import {Label} from "@/components/shadcn/label";
import {Input} from "@/components/coss-ui/input";
import {Checkbox} from "@/components/coss-ui/checkbox";
import {Switch} from "@/components/coss-ui/switch";
import {Button} from "@/components/shadcn/button";
import {Separator} from "@/components/shadcn/separator";
import {cn} from "@/lib/utils";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

type SettingsTab = "general" | "appearance" | "shortcuts" | "library" | "data" | "account";

const TABS: Array<{key: SettingsTab; label: string; description: string}> = [
  {key: "general", label: "General", description: "Defaults and small preferences."},
  {key: "appearance", label: "Appearance", description: "Theme, density, and focus."},
  {key: "shortcuts", label: "Shortcuts", description: "Keyboard cheat sheet."},
  {key: "library", label: "Library", description: "Archive & Trash live here."},
  {key: "data", label: "Data", description: "Import/export and maintenance."},
  {key: "account", label: "Account", description: "Signed-in info."},
];

function isSettingsTab(value: unknown): value is SettingsTab {
  return typeof value === "string" && TABS.some((t) => t.key === value);
}

function TabIcon({tab}: {tab: SettingsTab}) {
  switch (tab) {
    case "general":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.28187 2.58634C8.66491 2.01177 9.30974 1.66666 10.0003 1.66666C10.6909 1.66666 11.3357 2.01177 11.7187 2.58634L12.0413 3.07023C12.3735 3.56838 12.9792 3.80894 13.5627 3.67431L13.8808 3.60088C14.5864 3.43806 15.3261 3.65019 15.8381 4.16221C16.3502 4.67424 16.5622 5.41391 16.3994 6.11947L16.326 6.43768C16.1914 7.02106 16.4319 7.62685 16.9301 7.95895L17.414 8.28154C17.9886 8.66457 18.3337 9.30941 18.3337 9.99999C18.3337 10.6906 17.9886 11.3354 17.414 11.7184L16.9301 12.041C16.4319 12.3732 16.1914 12.9789 16.326 13.5623L16.3994 13.8805C16.5622 14.5861 16.3502 15.3257 15.8381 15.8377C15.3261 16.3498 14.5864 16.5619 13.8808 16.3991L13.5627 16.3257C12.9792 16.1911 12.3735 16.4316 12.0413 16.9297L11.7187 17.4137C11.3357 17.9882 10.6909 18.3333 10.0003 18.3333C9.30974 18.3333 8.66491 17.9882 8.28187 17.4137L7.95928 16.9297C7.62718 16.4316 7.02139 16.1911 6.43802 16.3257L6.11981 16.3991C5.41424 16.5619 4.67458 16.3498 4.16255 15.8377C3.65053 15.3257 3.43839 14.5861 3.60122 13.8805L3.67465 13.5623C3.80928 12.9789 3.56872 12.3732 3.07057 12.041L2.58668 11.7184C2.01211 11.3354 1.66699 10.6906 1.66699 9.99999C1.66699 9.30941 2.01211 8.66457 2.58668 8.28154L3.07057 7.95895C3.56872 7.62685 3.80928 7.02106 3.67465 6.43768L3.60122 6.11947C3.43839 5.41391 3.65053 4.67424 4.16255 4.16221C4.67458 3.65019 5.41424 3.43806 6.11981 3.60088L6.43802 3.67431C7.02139 3.80894 7.62718 3.56838 7.95928 3.07023L8.28187 2.58634ZM7.39616 9.99999C7.39616 8.56174 8.56208 7.39582 10.0003 7.39582C11.4386 7.39582 12.6045 8.56174 12.6045 9.99999C12.6045 11.4382 11.4386 12.6042 10.0003 12.6042C8.56208 12.6042 7.39616 11.4382 7.39616 9.99999Z"
            fill="currentColor"
          />
        </svg>
      );
    case "appearance":
      return (
        <svg
          width="19"
          height="19"
          viewBox="0 0 19 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_138_43)">
            <path
              d="M9.49967 17.4167C13.8719 17.4167 17.4163 13.8723 17.4163 9.50001C17.4163 5.12776 13.8719 1.58334 9.49967 1.58334C5.12742 1.58334 1.58301 5.12776 1.58301 9.50001C1.58301 13.8723 5.12742 17.4167 9.49967 17.4167Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 14.25C10.7598 14.25 11.968 13.7496 12.8588 12.8588C13.7496 11.968 14.25 10.7598 14.25 9.5C14.25 8.24022 13.7496 7.03204 12.8588 6.14124C11.968 5.25045 10.7598 4.75 9.5 4.75V14.25Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_138_43">
              <rect width="19" height="19" fill="currentColor" />
            </clipPath>
          </defs>
        </svg>
      );
    case "shortcuts":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M2.5 5.41667C2.5 3.80583 3.80583 2.5 5.41667 2.5C7.0275 2.5 8.33333 3.80583 8.33333 5.41667V7.08333H11.6667V5.41667C11.6667 3.80583 12.9725 2.5 14.5833 2.5C16.1942 2.5 17.5 3.80583 17.5 5.41667C17.5 7.0275 16.1942 8.33333 14.5833 8.33333H12.9167V11.6667H14.5833C16.1942 11.6667 17.5 12.9725 17.5 14.5833C17.5 16.1942 16.1942 17.5 14.5833 17.5C12.9725 17.5 11.6667 16.1942 11.6667 14.5833V12.9167H8.33333V14.5833C8.33333 16.1942 7.0275 17.5 5.41667 17.5C3.80583 17.5 2.5 16.1942 2.5 14.5833C2.5 12.9725 3.80583 11.6667 5.41667 11.6667H7.08333V8.33333H5.41667C3.80583 8.33333 2.5 7.0275 2.5 5.41667ZM7.08333 7.08333V5.41667C7.08333 4.49619 6.33714 3.75 5.41667 3.75C4.49619 3.75 3.75 4.49619 3.75 5.41667C3.75 6.33714 4.49619 7.08333 5.41667 7.08333H7.08333ZM8.33333 8.33333V11.6667H11.6667V8.33333H8.33333ZM7.08333 12.9167H5.41667C4.49619 12.9167 3.75 13.6628 3.75 14.5833C3.75 15.5038 4.49619 16.25 5.41667 16.25C6.33714 16.25 7.08333 15.5038 7.08333 14.5833V12.9167ZM12.9167 12.9167V14.5833C12.9167 15.5038 13.6628 16.25 14.5833 16.25C15.5038 16.25 16.25 15.5038 16.25 14.5833C16.25 13.6628 15.5038 12.9167 14.5833 12.9167H12.9167ZM12.9167 7.08333H14.5833C15.5038 7.08333 16.25 6.33714 16.25 5.41667C16.25 4.49619 15.5038 3.75 14.5833 3.75C13.6628 3.75 12.9167 4.49619 12.9167 5.41667V7.08333Z"
            fill="currentColor"
          />
        </svg>
      );
    case "library":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.79199 2.5C3.0661 2.5 1.66699 3.89911 1.66699 5.625V14.7308C1.66699 15.8 2.5337 16.6667 3.60283 16.6667H15.0042C16.0209 16.6667 16.916 15.9969 17.2028 15.0217L18.62 10.2032C18.8677 9.36125 18.3232 8.51792 17.5003 8.35975V7.29167C17.5003 6.02602 16.4743 5 15.2087 5H10.8923C10.544 5 10.2187 4.82593 10.0256 4.53615L9.59583 3.89156C9.01624 3.02219 8.04055 2.5 6.9957 2.5H4.79199ZM16.2503 8.33333V7.29167C16.2503 6.71637 15.784 6.25 15.2087 6.25H10.8923C10.1261 6.25 9.41058 5.86706 8.98549 5.22953L8.55583 4.58493C8.20804 4.06332 7.62261 3.75 6.9957 3.75H4.79199C3.75646 3.75 2.91699 4.58947 2.91699 5.625V14.7308C2.91699 15.1096 3.22406 15.4167 3.60283 15.4167C3.90708 15.4167 4.17496 15.2163 4.26081 14.9243L5.71551 9.97833C6.00236 9.00308 6.89745 8.33333 7.91406 8.33333H16.2503Z"
            fill="currentColor"
          />
        </svg>
      );
    case "data":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.81631 6.77022C5.66964 4.75127 7.66835 3.33333 9.99967 3.33333C12.9768 3.33333 15.4138 5.64618 15.6117 8.57308C17.6157 8.82299 19.1663 10.5325 19.1663 12.6042C19.1663 14.8478 17.3475 16.6667 15.1038 16.6667H5.83301C3.07158 16.6667 0.833008 14.4281 0.833008 11.6667C0.833008 9.25341 2.54219 7.2402 4.81631 6.77022ZM9.37467 7.29166C9.37467 6.94649 9.65451 6.66666 9.99967 6.66666C10.3448 6.66666 10.6247 6.94649 10.6247 7.29166V12.0327L11.6411 11.0164C11.8852 10.7723 12.2808 10.7723 12.5249 11.0164C12.769 11.2605 12.769 11.6562 12.5249 11.9002L10.4416 13.9836C10.1975 14.2277 9.80184 14.2277 9.55776 13.9836L7.4744 11.9002C7.23033 11.6562 7.23033 11.2605 7.4744 11.0164C7.71848 10.7723 8.11421 10.7723 8.35826 11.0164L9.37467 12.0327V7.29166Z"
            fill="currentColor"
          />
        </svg>
      );
    case "account":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.0003 1.66667C5.39746 1.66667 1.66699 5.39765 1.66699 10C1.66699 12.4142 2.69238 14.5886 4.33301 16.1105C5.82064 17.4899 7.81283 18.3333 10.0003 18.3333C12.1878 18.3333 14.18 17.4899 15.6677 16.1105C17.3082 14.5886 18.3337 12.4142 18.3337 10C18.3337 5.39765 14.6032 1.66667 10.0003 1.66667ZM4.98079 14.9973C6.08431 13.4783 7.84213 12.5 10.0003 12.5C12.1585 12.5 13.9163 13.4783 15.0198 14.9973C13.7373 16.2858 11.9632 17.0833 10.0003 17.0833C8.03743 17.0833 6.26334 16.2858 4.98079 14.9973ZM10.0003 5.625C8.50291 5.625 7.29199 6.83757 7.29199 8.33334C7.29199 9.82909 8.50291 11.0417 10.0003 11.0417C11.4977 11.0417 12.7087 9.82909 12.7087 8.33334C12.7087 6.83757 11.4977 5.625 10.0003 5.625Z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

function SettingsSidebar({activeTab}: {activeTab: SettingsTab}) {
  return (
    <Card size="sm" className="sticky top-6">
      <CardContent className="space-y-1">
        {TABS.map((t) => {
          const active = t.key === activeTab;
          return (
            <Link
              key={t.key}
              href={`/settings?tab=${t.key}`}
              className={cn(
                "hover:bg-muted/60 focus-visible:ring-ring/40 flex items-center gap-2 rounded-md px-2 py-2 outline-none focus-visible:ring-2",
                active ? "bg-muted text-foreground" : "text-secondary",
                "hover:bg-muted focus-visible:ring-ring/40 hover:text-foreground",
              )}>
              <span className={cn("shrink-0")}>
                <TabIcon tab={t.key} />
              </span>
              <div className="text-sm font-medium">{t.label}</div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SettingsCardActions() {
  return (
    <CardFooter className="bg-muted/72 justify-end gap-2 border-t py-4!">
      <Button variant="outline" disabled>
        Cancel
      </Button>
      <Button variant="default" disabled>
        Save
      </Button>
    </CardFooter>
  );
}

function GeneralPanel() {
  return (
    <Card className="py-0! pt-6!">
      <CardHeader className="border-b">
        <CardTitle>General</CardTitle>
        <CardDescription>Defaults and small quality-of-life preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2">
          <Label>Start page</Label>
          <Select defaultValue="all">
            <SelectTrigger className="w-full justify-between">
              <SelectValue placeholder="Choose a start page" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectGroup>
                <SelectItem value="all">All items</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">Where you land after login.</p>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="leading-5">Open links in a new tab</Label>
            <p className="text-muted-foreground text-xs">Keeps Void open while you browse.</p>
          </div>
          <Switch defaultChecked aria-label="Open links in a new tab" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="leading-5">Confirm before deleting</Label>
            <p className="text-muted-foreground text-xs">
              Adds an extra safety step for destructive actions.
            </p>
          </div>
          <Switch defaultChecked aria-label="Confirm before deleting" />
        </div>
      </CardContent>
      <SettingsCardActions />
    </Card>
  );
}

function AppearancePanel() {
  return (
    <Card className="py-0! pt-6!">
      <CardHeader className="border-b">
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Make the library feel right.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <Select defaultValue="system">
              <SelectTrigger className="w-full justify-between">
                <SelectValue placeholder="Choose theme" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Your header toggle can override this later.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Density</Label>
            <Select defaultValue="comfortable">
              <SelectTrigger className="w-full justify-between">
                <SelectValue placeholder="Choose density" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">Affects spacing in list & grid views.</p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="leading-5">Zen mode</Label>
            <p className="text-muted-foreground text-xs">
              Hide non-essential UI until you move the mouse.
            </p>
          </div>
          <Checkbox aria-label="Zen mode" />
        </div>
      </CardContent>
      <SettingsCardActions />
    </Card>
  );
}

function ShortcutsPanel() {
  return (
    <Card className="py-0! pt-6!">
      <CardHeader className="border-b">
        <CardTitle>Shortcuts</CardTitle>
        <CardDescription>Keep muscle memory close.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Toggle list/grid</span>
            <kbd className="bg-muted text-foreground rounded-md px-2 py-1 text-xs">Shift V</kbd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Exit selection mode</span>
            <kbd className="bg-muted text-foreground rounded-md px-2 py-1 text-xs">Esc</kbd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Search</span>
            <kbd className="bg-muted text-foreground rounded-md px-2 py-1 text-xs">Ctrl K</kbd>
          </div>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled>
            Customize shortcuts
          </Button>
          <p className="text-muted-foreground self-center text-xs">UI stub (coming soon).</p>
        </div>
      </CardContent>
      <SettingsCardActions />
    </Card>
  );
}

function LibraryPanel() {
  return (
    <Card className="py-0! pt-6!">
      <CardHeader className="border-b">
        <CardTitle>Library</CardTitle>
        <CardDescription>Archive and Trash live here (not in your sidebar).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className="justify-start" disabled>
            Open Archive
          </Button>
          <Button variant="outline" className="justify-start" disabled>
            Open Trash
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          This keeps your main navigation focused on active items.
        </p>
      </CardContent>
      <SettingsCardActions />
    </Card>
  );
}

function DataPanel() {
  return (
    <Card className="py-0! pt-6!">
      <CardHeader className="border-b">
        <CardTitle>Data</CardTitle>
        <CardDescription>Backup, restore, and maintenance (UI only).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2">
          <Label>Import</Label>
          <Input type="file" nativeInput />
          <p className="text-muted-foreground text-xs">
            Accepts JSON/CSV (stub UI; no processing yet).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled>
            Export data
          </Button>
          <Button variant="destructive" disabled>
            Wipe local data
          </Button>
          <span className="text-muted-foreground text-xs">UI stub (no action).</span>
        </div>
      </CardContent>
      <SettingsCardActions />
    </Card>
  );
}

function AccountPanel({email}: {email: string | null}) {
  return (
    <Card className="py-0! pt-6!">
      <CardHeader className="border-b">
        <CardTitle>Account</CardTitle>
        <CardDescription>Basic account info for email OTP sign-in.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input value={email ?? ""} placeholder="you@example.com" readOnly />
          <p className="text-muted-foreground text-xs">{email ? "Signed in." : "Not signed in."}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled>
            Sign out
          </Button>
          <span className="text-muted-foreground text-xs">
            Sign-out is available in the header menu.
          </span>
        </div>
      </CardContent>
      <SettingsCardActions />
    </Card>
  );
}

const page = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  const email = data?.user?.email ?? null;
  const resolvedSearchParams = (await searchParams) ?? {};
  const tabParam = resolvedSearchParams.tab;
  const tab = isSettingsTab(tabParam) ? tabParam : "general";

  return (
    <AppShell session={data}>
      <ScrollArea scrollFade scrollbarGutter>
        <div className="mx-auto w-full max-w-5xl px-6 py-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-medium tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Tune Void to your workflow. Changes here only affect this browser
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 pb-10 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <SettingsSidebar activeTab={tab} />
            </aside>
            <div className="min-w-0">
              {tab === "general" && <GeneralPanel />}
              {tab === "appearance" && <AppearancePanel />}
              {tab === "shortcuts" && <ShortcutsPanel />}
              {tab === "library" && <LibraryPanel />}
              {tab === "data" && <DataPanel />}
              {tab === "account" && <AccountPanel email={email} />}
            </div>
          </div>
        </div>
      </ScrollArea>
    </AppShell>
  );
};

export default page;
