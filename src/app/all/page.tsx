import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import AllItemsClient from "./AllItemsClient";
import {createClient} from "@/components/utils/supabase/server";
import {redirect} from "next/navigation";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data?.user?.id) {
    redirect("/login");
  }

  const supabase = await createClient();

  const {data: bookmarks} = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", data?.user?.id);
  if (!bookmarks) {
    return <AppShell session={data}>No bookmarks found</AppShell>;
  }
  return (
    <AppShell session={data}>
      <AllItemsClient items={bookmarks} />
    </AppShell>
  );
};

export default page;
