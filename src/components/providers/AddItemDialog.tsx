"use client";

import React, {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {z} from "zod";

import {Button} from "@/components/coss-ui/button";
import {Button as ShadcnButton} from "@/components/shadcn/button";
import {Input} from "@/components/coss-ui/input";
import {toastManager} from "@/components/coss-ui/toast";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/coss-ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/coss-ui/dialog";
import {addBookmark, type AddBookmarkResult} from "@/app/actions/bookmarks";
import {cn} from "@/lib/utils";
import {Toggle} from "../coss-ui/toggle";

const TAG_SUGGESTIONS = [
  "read",
  "watch",
  "work",
  "later",
  "reference",
  "design",
  "frontend",
  "backend",
  "ai",
  "docs",
] as const;

function normalizeTag(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

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

export function AddItemDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [allTagsSelected, setAllTagsSelected] = useState(false);
  const queryClient = useQueryClient();

  const addTagFromQuery = React.useCallback(() => {
    const nextTag = normalizeTag(tagQuery.replace(/,+$/, ""));
    if (!nextTag) return;

    const exists = tags.some((t) => t.toLowerCase() === nextTag.toLowerCase());
    if (!exists) setTags((prev) => [...prev, nextTag]);
    setTagQuery("");
  }, [tagQuery, tags]);

  const filteredSuggestions = React.useMemo(() => {
    const q = normalizeTag(tagQuery).toLowerCase();

    const selected = new Set(tags.map((t) => t.toLowerCase()));

    const base = TAG_SUGGESTIONS.filter((t) => !selected.has(t.toLowerCase()));
    if (!q) return base;

    return base.filter((t) => t.toLowerCase().includes(q));
  }, [tagQuery, tags]);

  const clearTagSelection = React.useCallback(() => setAllTagsSelected(false), []);

  const clearAllTags = React.useCallback(() => {
    setTags([]);
    setTagQuery("");
    setAllTagsSelected(false);
  }, []);

  const handleTagsKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const isSelectAll = (e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A");
      if (isSelectAll && tags.length > 0) {
        e.preventDefault();
        setAllTagsSelected(true);
        return;
      }

      const isDeleteKey = e.key === "Backspace" || e.key === "Delete";
      if (allTagsSelected && isDeleteKey && tags.length > 0) {
        e.preventDefault();
        clearAllTags();
        return;
      }

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTagFromQuery();
        clearTagSelection();
        return;
      }

      if (e.key === "Backspace" && tagQuery.length === 0 && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
        clearTagSelection();
      }
    },
    [
      addTagFromQuery,
      allTagsSelected,
      clearAllTags,
      clearTagSelection,
      tagQuery.length,
      tags.length,
    ],
  );

  const addItemMutation = useMutation<AddBookmarkResult, Error, {url: string}>({
    mutationKey: ["add-bookmark"],
    mutationFn: async (input) => {
      return await addBookmark(input);
    },
    onSuccess: (res) => {
      toastManager.add({
        title: "Bookmark added",
        description: res.url,
        type: "success",
      });
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
    },
    onError: (err) => {
      toastManager.add({
        title: "Submit failed",
        description:
          (err instanceof Error ? err.message : "Unknown error")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 160) || "Unknown error",
        type: "error",
      });
    },
  });

  const validateUrl = (rawUrl: string) => {
    const parsed = addItemUrlSchema.safeParse(rawUrl);
    if (!parsed.success) {
      setUrlError(parsed.error.issues[0]?.message ?? "Invalid URL");
      return null;
    }
    setUrlError(null);
    return parsed.data;
  };

  const submit = () => {
    const parsed = validateUrl(url);
    if (!parsed) return;
    setOpen(false);
    setUrl("");
    setUrlError(null);
    clearAllTags();
    addItemMutation.mutate({url: parsed});
  };

  return (
    <div className="absolute right-6 bottom-6">
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            // Keep the URL, but clear validation UI when closing the dialog.
            setTimeout(() => {
              setUrlError(null);
            }, 1000);
          }
        }}>
        <ShadcnButton
          variant="default"
          size="icon-lg"
          className="size-12 rounded-full"
          onClick={() => setOpen(true)}>
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
        </ShadcnButton>

        <DialogPopup className="duration-250 ease-in-out data-ending-style:translate-y-2 data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:scale-98 data-starting-style:opacity-0">
          <DialogHeader>
            <DialogTitle>Add item</DialogTitle>
          </DialogHeader>

          <DialogPanel>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}>
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">URL</div>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  aria-invalid={!!urlError}
                  onChange={(e) => {
                    const next = e.target.value;
                    setUrl(next);
                    if (urlError) validateUrl(next);
                  }}
                />
                {urlError ? (
                  <div className="text-destructive text-sm" role="alert">
                    {urlError}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">Tags</div>
                <div className="flex items-center gap-2">
                  <Combobox
                    multiple
                    value={tags}
                    onValueChange={(next) => {
                      setTags(next as string[]);
                      setTagQuery("");
                      clearTagSelection();
                    }}>
                    <ComboboxChips
                      aria-label="Tags"
                      // className={allTagsSelected ? "ring-ring/30 ring-2" : undefined}
                    >
                      {tags.map((t) => (
                        <ComboboxChip
                          key={t}
                          className={cn(
                            allTagsSelected ? "ring-ring/80 ring-2" : undefined,
                            "text-sm!",
                          )}>
                          #{t}
                        </ComboboxChip>
                      ))}

                      <ComboboxChipsInput
                        placeholder="Add tags"
                        value={tagQuery}
                        onChange={(e) => {
                          setTagQuery(e.target.value);
                          if (allTagsSelected) clearTagSelection();
                        }}
                        onKeyDown={handleTagsKeyDown}
                      />
                    </ComboboxChips>

                    {filteredSuggestions.length > 0 ? (
                      <ComboboxPopup>
                        <ComboboxList>
                          {filteredSuggestions.map((t) => (
                            <ComboboxItem key={t} value={t}>
                              {t}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxPopup>
                    ) : null}
                  </Combobox>
                  <Toggle variant="ai" size="sm" className="sm:h-8 sm:min-w-8">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9.16683 5.16667C9.16683 4.89053 8.94296 4.66667 8.66683 4.66667C8.3907 4.66667 8.16683 4.89053 8.16683 5.16667C8.16683 6.78387 7.80956 7.83421 7.1553 8.48847C6.50101 9.14274 5.4507 9.50001 3.8335 9.50001C3.55736 9.50001 3.3335 9.72387 3.3335 10C3.3335 10.2761 3.55736 10.5 3.8335 10.5C5.4507 10.5 6.50101 10.8573 7.1553 11.5115C7.80956 12.1658 8.16683 13.2161 8.16683 14.8333C8.16683 15.1095 8.3907 15.3333 8.66683 15.3333C8.94296 15.3333 9.16683 15.1095 9.16683 14.8333C9.16683 13.2161 9.5241 12.1658 10.1784 11.5115C10.8326 10.8573 11.883 10.5 13.5002 10.5C13.7763 10.5 14.0002 10.2761 14.0002 10C14.0002 9.72387 13.7763 9.50001 13.5002 9.50001C11.883 9.50001 10.8326 9.14274 10.1784 8.48847C9.5241 7.83421 9.16683 6.78387 9.16683 5.16667Z"
                        fill="white"
                      />
                      <path
                        d="M4.00016 3.66666C4.00016 3.48257 3.85092 3.33333 3.66683 3.33333C3.48274 3.33333 3.3335 3.48257 3.3335 3.66666C3.3335 4.32041 3.18869 4.71506 2.95196 4.95179C2.71523 5.18852 2.32058 5.33333 1.66683 5.33333C1.48274 5.33333 1.3335 5.48257 1.3335 5.66666C1.3335 5.85075 1.48274 5.99999 1.66683 5.99999C2.32058 5.99999 2.71523 6.1448 2.95196 6.38153C3.18869 6.61826 3.3335 7.01293 3.3335 7.66666C3.3335 7.85073 3.48274 7.99999 3.66683 7.99999C3.85092 7.99999 4.00016 7.85073 4.00016 7.66666C4.00016 7.01293 4.14497 6.61826 4.3817 6.38153C4.61843 6.1448 5.01308 5.99999 5.66683 5.99999C5.85092 5.99999 6.00016 5.85075 6.00016 5.66666C6.00016 5.48257 5.85092 5.33333 5.66683 5.33333C5.01308 5.33333 4.61843 5.18852 4.3817 4.95179C4.14497 4.71506 4.00016 4.32041 4.00016 3.66666Z"
                        fill="white"
                      />
                      <path
                        d="M7.3335 1.00001C7.3335 0.815912 7.18423 0.666672 7.00016 0.666672C6.8161 0.666672 6.66683 0.815912 6.66683 1.00001C6.66683 1.42228 6.57295 1.65026 6.44502 1.77819C6.31708 1.90612 6.0891 2.00001 5.66683 2.00001C5.48274 2.00001 5.3335 2.14924 5.3335 2.33334C5.3335 2.51743 5.48274 2.66667 5.66683 2.66667C6.0891 2.66667 6.31708 2.76055 6.44502 2.88848C6.57295 3.01642 6.66683 3.2444 6.66683 3.66667C6.66683 3.85076 6.8161 4 7.00016 4C7.18423 4 7.3335 3.85076 7.3335 3.66667C7.3335 3.2444 7.42736 3.01642 7.5553 2.88848C7.68323 2.76055 7.91123 2.66667 8.3335 2.66667C8.51756 2.66667 8.66683 2.51743 8.66683 2.33334C8.66683 2.14924 8.51756 2.00001 8.3335 2.00001C7.91123 2.00001 7.68323 1.90612 7.5553 1.77819C7.42736 1.65026 7.3335 1.42228 7.3335 1.00001Z"
                        fill="white"
                      />
                    </svg>
                  </Toggle>
                </div>
              </div>
            </form>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button type="button" disabled={addItemMutation.isPending} onClick={submit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
