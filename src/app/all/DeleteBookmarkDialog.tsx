"use client";

import {Button} from "@/components/coss-ui/button";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/coss-ui/alert-dialog";
import type {Bookmark} from "@/components/Bookmark";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteBookmark} from "@/app/actions/bookmarks";
import {toastManager} from "@/components/coss-ui/toast";

export function DeleteBookmarkDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Bookmark;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationKey: ["delete-bookmark"],
    mutationFn: async (id: string) => {
      return deleteBookmark(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
      toastManager.add({
        title: "Bookmark deleted",
        type: "success",
      });
    },
    onError: (error) => {
      console.error("Failed to delete bookmark:", error);
      toastManager.add({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete bookmark",
        type: "error",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your bookmark and remove it
            from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              if (item) {
                deleteMutation.mutate(item.id);
                onOpenChange(false);
              }
            }}>
            Delete Bookmark
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
