export type BookmarkTagJoinRow = {tags: {name: string} | null} | null;

export function tagNamesFromJoin(bookmark_tags?: BookmarkTagJoinRow[] | null): string[] {
  const names = (bookmark_tags ?? []).flatMap((bt) => {
    const name = bt?.tags?.name;
    return name ? [name] : [];
  });

  return names.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}));
}
