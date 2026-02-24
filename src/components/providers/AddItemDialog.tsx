"use client";

import React, {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {z} from "zod";
import {Button} from "@/components/coss-ui/button";
import {Button as ShadcnButton} from "@/components/shadcn/button";
import {Input} from "@/components/coss-ui/input";
import {toastManager} from "@/components/coss-ui/toast";

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
import TagsInput from "../ui/TagsInput";
import {Label} from "../coss-ui/label";

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
  const [tags, setTags] = useState<string[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const addItemMutation = useMutation<AddBookmarkResult, Error, {url: string; tags: string[]}>({
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
      queryClient.invalidateQueries({queryKey: ["tags"]});
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
    setTags([]);
    setUrlError(null);
    addItemMutation.mutate({url: parsed, tags});
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
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="url">URL</Label>
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

              <TagsInput value={tags} onValueChange={setTags} name="tags" sortOnAdd={false} />
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
