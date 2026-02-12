import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import AllItemsClient from "./AllItemsClient";
import {createClient} from "@/components/utils/supabase/server";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  // if (!data?.user?.id) {
  //   redirect("/login");
  // }

  const supabase = await createClient();

  const PAGE_SIZE = 20;

  const {
    data: initialBookmarks,
    count: totalCount,
    error,
  } = await supabase
    .from("bookmarks")
    .select("*", {count: "exact"})
    .eq("user_id", data?.user?.id)
    .order("created_at", {ascending: false})
    .range(0, PAGE_SIZE - 1);

  if (error) {
    return <AppShell session={data}>Failed to load bookmarks</AppShell>;
  }

  return (
    <AppShell session={data}>
      <AllItemsClient
        userId={data?.user?.id ?? null}
        initialBookmarks={initialBookmarks ?? []}
        totalCount={totalCount ?? 0}
        PAGE_SIZE={PAGE_SIZE}
      />
    </AppShell>
  );
};

export default page;
