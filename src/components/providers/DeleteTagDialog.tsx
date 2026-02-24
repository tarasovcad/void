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
import {toastManager} from "@/components/coss-ui/toast";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteTags} from "@/app/actions/tags";

export function DeleteTagDialog({
  open,
  onOpenChange,
  tags,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: {id: string; name: string}[];
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const count = tags.length;

  const deleteMutation = useMutation({
    mutationKey: ["delete-tag"],
    mutationFn: async (ids: string | string[]) => {
      return deleteTags(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["tags"]});
      queryClient.invalidateQueries({queryKey: ["bookmarks"]});
    },
    onError: (error) => {
      console.error("Failed to delete tag:", error);
      toastManager.add({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete tag",
        type: "error",
      });
    },
  });

  const handleDelete = () => {
    if (count === 0) return;

    const ids = tags.map((t) => t.id);
    deleteMutation.mutate(ids);

    toastManager.add({
      title: count === 1 ? "Tag deleted" : `${count} tags deleted`,
      type: "success",
    });

    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count <= 1 ? "Delete tag?" : `Delete ${count} tags?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count <= 1
              ? `The tag "${tags[0]?.name}" will be permanently removed. This won't delete the bookmarks associated with it.`
              : `These ${count} tags will be permanently removed. This won't delete the bookmarks associated with them.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            {count <= 1 ? "Delete Tag" : `Delete ${count} Tags`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
