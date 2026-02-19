export type BookmarkTagJoinRow = {tags: {name: string} | null} | null;

export function tagNamesFromJoin(bookmark_tags?: BookmarkTagJoinRow[] | null): string[] {
  return (bookmark_tags ?? []).flatMap((bt) => {
    const name = bt?.tags?.name;
    return name ? [name] : [];
  });
}
