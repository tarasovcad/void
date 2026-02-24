"use server";

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {createClient} from "@/components/utils/supabase/server";

type TagsWithCountsRow = {id: string; name: string; count: number | string | null};

export async function generateAiSuggestions() {
  return {
    suggestions: ["react", "nextjs", "typescript", "tailwind", "ui"],
  };
}

export async function getTags() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const supabase = await createClient();
  const {data, error} = await supabase.rpc("get_tags_with_counts", {p_user_id: session.user.id});

  if (error) {
    console.error("Failed to fetch tags with counts:", error);
    return [];
  }

  return ((data ?? []) as TagsWithCountsRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    count: typeof t.count === "string" ? Number(t.count) : (t.count ?? 0),
  }));
}
