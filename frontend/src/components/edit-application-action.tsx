"use client";

import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { JobApplicationForm } from "@/components/jobApplicationForm";
import type { JobApplication } from "@/types/jobApplication";

/**
 * Row action that edits an application's metadata in a dialog. The shared form
 * is prefilled with the row; the authenticated Clerk user owns the write.
 */
export function EditApplicationAction({ application }: { application: JobApplication }) {
  const { userId } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!userId}
          aria-label={`Edit application for ${application.position}`}
        >
          <PencilIcon className="size-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] overflow-y-auto p-0"
      >
        {open && userId ? (
          <JobApplicationForm
            user_id={userId}
            application={application}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
