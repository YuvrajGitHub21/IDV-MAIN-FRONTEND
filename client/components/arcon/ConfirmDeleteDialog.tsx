import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName?: string;
  onConfirm: () => Promise<void> | void;
}

export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  templateName,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-roboto">
            Delete template
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="px-5 py-2">
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{templateName}</strong>?
            This action cannot be undone.
          </AlertDialogDescription>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className="ml-2 bg-destructive text-white"
              onClick={async () => {
                try {
                  await onConfirm();
                } catch (err) {
                  // swallow, caller handles errors
                }
              }}
            >
              <Trash className="w-4 h-4 mr-2" /> Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
