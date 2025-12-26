"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteAccountAction, DeleteAccountState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const INITIAL_DELETE_STATE: DeleteAccountState = {
  status: "idle",
  message: "",
};

export function DeleteAccountDialog({ userId }: { userId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteAccountAction,
    INITIAL_DELETE_STATE
  );
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Account deleted", {
        description: state.message,
      });
      router.replace("/");
    } else if (state.status === "error" && state.message) {
      toast.error("Unable to delete account", {
        description: state.message,
      });
    }
  }, [state, router]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="mt-2">
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-card-foreground">
            This action cannot be undone. This will delete your account and associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={formAction} className="flex w-full items-center gap-3">
          <AlertDialogCancel asChild>
            <Button variant="destructive" type="button">
              Cancel
            </Button>
          </AlertDialogCancel>
          <input type="hidden" name="user_id" value={userId} />
          <DeleteAccountSubmitButton pending={isPending} />
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteAccountSubmitButton({ pending }: { pending: boolean }) {
  return (
    <AlertDialogAction asChild>
      <Button
        type="submit"
        variant="destructive"
        className="ml-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
        disabled={pending}
      >
        {pending ? "Deleting..." : "Delete Account"}
      </Button>
    </AlertDialogAction>
  );
}
