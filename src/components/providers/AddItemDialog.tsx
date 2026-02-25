"use client";

import React, {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {z} from "zod";
import {useForm, Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button} from "@/components/coss-ui/button";
import {Button as ShadcnButton} from "@/components/shadcn/button";
import {Input} from "@/components/coss-ui/input";
import {toastManager} from "@/components/coss-ui/toast";
import {SearchIcon} from "lucide-react";
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
import type {Collection} from "@/app/actions/collections";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/coss-ui/combobox";
import {SelectButton, Select} from "@/components/coss-ui/select";

const addItemSchema = z.object({
  url: z
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
    }, "URL must start with http:// or https://"),
  tags: z.array(z.string()),
  collectionId: z.string().nullable().optional(),
});

type AddItemFormValues = z.infer<typeof addItemSchema>;

export function AddItemDialog({collections = []}: {collections?: Collection[]}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: {errors, isValid},
  } = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      url: "",
      tags: [],
      collectionId: null,
    },
    mode: "onChange",
  });

  const addItemMutation = useMutation<
    AddBookmarkResult,
    Error,
    {url: string; tags: string[]; collectionId?: string}
  >({
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

  const onSubmit = (data: AddItemFormValues) => {
    setOpen(false);
    addItemMutation.mutate({
      url: data.url,
      tags: data.tags,
      collectionId: data.collectionId ?? undefined,
    });
    reset();
  };

  const collectionItems = React.useMemo(
    () =>
      collections.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [collections],
  );

  return (
    <div className="absolute right-6 bottom-6">
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            reset();
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
              id="add-item-form"
              className="flex flex-col gap-5"
              onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  {...register("url")}
                  aria-invalid={!!errors.url}
                />
                {errors.url ? (
                  <div className="text-destructive text-sm" role="alert">
                    {errors.url.message}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Collection</Label>
                <Controller
                  name="collectionId"
                  control={control}
                  render={({field}) => {
                    const selectedItem =
                      collectionItems.find((item) => item.value === field.value) ?? null;

                    return (
                      <Combobox
                        items={collectionItems}
                        value={selectedItem}
                        onValueChange={(val) => {
                          field.onChange(val?.value ?? null);
                        }}>
                        <Select>
                          <ComboboxTrigger render={<SelectButton />}>
                            <ComboboxValue placeholder="Select a collection" />
                          </ComboboxTrigger>
                        </Select>
                        <ComboboxPopup
                          aria-label="Select a collection"
                          className="w-(--anchor-width)">
                          <div className="border-b p-2">
                            <ComboboxInput
                              className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
                              placeholder="Search collections..."
                              showTrigger={false}
                              startAddon={<SearchIcon className="size-4" />}
                            />
                          </div>
                          <ComboboxEmpty>No collections found.</ComboboxEmpty>
                          <ComboboxList>
                            {(item) => (
                              <ComboboxItem key={item.value} value={item}>
                                {item.label}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxPopup>
                      </Combobox>
                    );
                  }}
                />
              </div>

              <Controller
                name="tags"
                control={control}
                render={({field}) => (
                  <TagsInput
                    value={field.value}
                    onValueChange={field.onChange}
                    name="tags"
                    sortOnAdd={false}
                  />
                )}
              />
            </form>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
            <Button
              type="submit"
              form="add-item-form"
              disabled={addItemMutation.isPending || !isValid}>
              Submit
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
