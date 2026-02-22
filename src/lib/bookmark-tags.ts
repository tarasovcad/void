export type BookmarkTagJoinRow = {tags: {name: string} | null} | null;

export function tagNamesFromJoin(bookmark_tags?: BookmarkTagJoinRow[] | null): string[] {
  console.log(bookmark_tags);
  const names = (bookmark_tags ?? []).flatMap((bt) => {
    const name = bt?.tags?.name;
    return name ? [name] : [];
  });
  console.log(names.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"})));
  return names.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}));
}
