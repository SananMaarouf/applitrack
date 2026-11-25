"use client";

import { z } from "zod";
import { format, parse, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useJobsStore } from "@/store/jobsStore";
import { CalendarIcon, PaperclipIcon, PencilIcon, Trash2Icon, SquarePlusIcon, XIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { createApplication, updateApplication } from "@/api/applications";
import { uploadAttachment } from "@/api/applications";
import { useAuth } from "@clerk/clerk-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { JobApplication } from "@/types/jobApplication";
import type { UpdateApplicationPayload } from "@/api/applications";

const formSchema = z.object({
  position: z.string().min(1, { message: "Position is required" }),
  company: z.string().min(1, { message: "Company name is required" }),
  applied_at: z.date({
    required_error: "Date applied is required",
    invalid_type_error: "Date applied must be a valid date",
  }),
  expires_at: z
    .date({
      required_error: "Date expires is required",
      invalid_type_error: "Date expires must be a valid date",
    })
    .optional(),
  link: z.string().optional(),
});

function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return isValid(date) ? date : undefined;
}

function dateText(value: Date | undefined): string {
  return value && isValid(value) ? format(value, "yyyy-MM-dd") : "";
}

/** Parse a typed YYYY-MM-DD value without letting impossible days roll over. */
function parseDateText(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = parse(trimmed, "yyyy-MM-dd", new Date());
  if (!isValid(parsed)) return null;
  return format(parsed, "yyyy-MM-dd") === trimmed ? parsed : null;
}

export function JobApplicationForm({
  user_id,
  onClose,
  onSuccess,
  application,
}: {
  user_id: string;
  onClose?: () => void;
  /** Called only after the server confirmed the application was saved. */
  onSuccess?: (application: JobApplication) => void;
  /** Existing row to edit. Omit to create a new application. */
  application?: JobApplication;
}) {
  const { getToken } = useAuth();
  const isEditing = application !== undefined;
  const initialAppliedDate = application ? parseDate(application.applied_at) : new Date();
  const initialAppliedDateText = application
    ? dateText(initialAppliedDate)
    : format(new Date(), "yyyy-MM-dd");
  const initialExpiresDate = application ? parseDate(application.expires_at) : undefined;
  const initialExpiresDateText = dateText(initialExpiresDate);
  const initialLink = application?.link ?? "";
  const [appliedDateOpen, setAppliedDateOpen] = useState(false);
  const [expiresDateOpen, setExpiresDateOpen] = useState(false);
  const [appliedDateText, setAppliedDateText] = useState(initialAppliedDateText);
  const [expiresDateText, setExpiresDateText] = useState(initialExpiresDateText);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: application?.position ?? "",
      company: application?.company ?? "",
      applied_at: initialAppliedDate ?? new Date(),
      expires_at: initialExpiresDate,
      link: initialLink,
    },
  });

  function handleDateTextChange(
    name: "applied_at" | "expires_at",
    text: string,
    onChange: (value: Date | undefined) => void,
    setText: (value: string) => void,
  ) {
    setText(text);
    if (text === "") {
      onChange(undefined);
      form.clearErrors(name);
      return;
    }

    const parsed = parseDateText(text);
    if (parsed) {
      onChange(parsed);
      form.clearErrors(name);
      return;
    }

    onChange(undefined);
    if (text.length === 10) {
      form.setError(name, {
        type: "manual",
        message: "Enter a valid date in YYYY-MM-DD format",
      });
    }
  }

  function handleDateBlur(name: "applied_at" | "expires_at", text: string) {
    if (text === "") {
      if (name === "applied_at") {
        form.setError(name, { type: "required", message: "Date applied is required" });
      } else {
        form.clearErrors(name);
      }
      return;
    }
    if (!parseDateText(text)) {
      form.setError(name, {
        type: "manual",
        message: "Enter a valid date in YYYY-MM-DD format",
      });
    }
  }

  function resetForm() {
    const appliedDate = isEditing ? initialAppliedDate : new Date();
    form.reset({
      position: application?.position ?? "",
      company: application?.company ?? "",
      applied_at: appliedDate ?? new Date(),
      expires_at: initialExpiresDate,
      link: initialLink,
    });
    setAppliedDateText(isEditing ? initialAppliedDateText : format(new Date(), "yyyy-MM-dd"));
    setExpiresDateText(isEditing ? initialExpiresDateText : "");
    setAttachmentFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /**
   * Only send fields the user actually changed. Untouched date inputs keep the
   * original server timestamp (including its time of day) instead of being
   * rewritten to local midnight, and untouched optional fields stay omitted.
   */
  function buildUpdatePayload(data: z.infer<typeof formSchema>): UpdateApplicationPayload {
    if (!application) return {};
    const payload: UpdateApplicationPayload = {};

    if (data.position !== application.position) payload.position = data.position;
    if (data.company !== application.company) payload.company = data.company;

    if (appliedDateText !== initialAppliedDateText) {
      payload.applied_at = new Date(data.applied_at).toISOString();
    }
    if (expiresDateText !== initialExpiresDateText) {
      payload.expires_at = data.expires_at ? new Date(data.expires_at).toISOString() : null;
    }
    const link = data.link ? data.link : null;
    if (link !== (application.link ?? null)) {
      payload.link = link;
    }

    return payload;
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!parseDateText(appliedDateText)) {
      form.setError("applied_at", {
        type: "manual",
        message: appliedDateText
          ? "Enter a valid date in YYYY-MM-DD format"
          : "Date applied is required",
      });
      return;
    }
    if (expiresDateText !== "" && !parseDateText(expiresDateText)) {
      form.setError("expires_at", {
        type: "manual",
        message: "Enter a valid date in YYYY-MM-DD format",
      });
      return;
    }

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const updatePayload = application ? buildUpdatePayload(data) : null;
      if (application && Object.keys(updatePayload!).length === 0 && !attachmentFile) {
        // Nothing to send: never PATCH an empty body just to close the dialog.
        onClose?.();
        return;
      }

      let saved: JobApplication;
      if (application) {
        saved =
          updatePayload && Object.keys(updatePayload).length > 0
            ? ((await updateApplication(token, application.id, updatePayload)) as unknown as JobApplication)
            : application;
      } else {
        saved = (await createApplication(token, {
          position: data.position,
          company: data.company,
          applied_at: new Date(data.applied_at).toISOString(),
          expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
          link: data.link || null,
        })) as unknown as JobApplication;
      }

      // Upload the PDF attachment if one was selected
      if (attachmentFile) {
        try {
          saved = (await uploadAttachment(token, saved.id, attachmentFile)) as unknown as JobApplication;
        } catch (attachErr: any) {
          toast.warning("Application saved, but attachment upload failed", {
            description: attachErr?.message || "Could not upload the PDF",
          });
        }
      }

      const savedApplication = saved as unknown as JobApplication;
      const jobsStore = useJobsStore.getState();
      if (isEditing) {
        jobsStore.editJob(savedApplication, user_id);
      } else {
        jobsStore.addJob(savedApplication, user_id);
      }

      if (isEditing) {
        toast.success("Job application updated", {
          description: "Your changes have been saved",
        });
      } else {
        toast.success("Job application saved successfully", {
          description: "Your application has been registered",
        });
      }

      resetForm();

      // Optional hook for the first-application journey. It runs only after a
      // confirmed server save, never for validation or failed requests.
      onSuccess?.(savedApplication);
      // Closing on success lets a first save from any entry point reveal the
      // celebration instead of leaving it hidden behind an open dialog.
      onClose?.();
    } catch (error: any) {
      toast.error("Error", {
        description: error?.message || "An error occurred while saving the job application",
      });
      console.error("Error saving job application:", error);
    }
  }

  return (
    <div className="w-full rounded-xl bg-card p-4 text-card-foreground sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <DialogTitle className="text-base font-semibold sm:text-lg">
            {isEditing ? "Edit application" : "Register application"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEditing
              ? "Update the details for this application."
              : "Add a role and keep its progress up to date."}
          </DialogDescription>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="inline-flex text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close form"
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Frontend Developer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applied_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Applied*</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={appliedDateText}
                      onChange={(e) =>
                        handleDateTextChange(
                          "applied_at",
                          e.target.value,
                          field.onChange,
                          setAppliedDateText,
                        )
                      }
                      onBlur={() => handleDateBlur("applied_at", appliedDateText)}
                    />
                  </FormControl>
                  <Popover open={appliedDateOpen} onOpenChange={setAppliedDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        className="shrink-0"
                        aria-label="Choose date applied"
                      >
                        <CalendarIcon className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setAppliedDateText(date ? format(date, "yyyy-MM-dd") : "");
                          form.clearErrors("applied_at");
                          setAppliedDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Expires (optional)</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={expiresDateText}
                      onChange={(e) =>
                        handleDateTextChange(
                          "expires_at",
                          e.target.value,
                          field.onChange,
                          setExpiresDateText,
                        )
                      }
                      onBlur={() => handleDateBlur("expires_at", expiresDateText)}
                    />
                  </FormControl>
                  <Popover open={expiresDateOpen} onOpenChange={setExpiresDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        className="shrink-0"
                        aria-label="Choose expiry date"
                      >
                        <CalendarIcon className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setExpiresDateText(date ? format(date, "yyyy-MM-dd") : "");
                          form.clearErrors("expires_at");
                          setExpiresDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PDF attachment */}
          <div className="space-y-2">
            <label
              htmlFor="pdf-attachment"
              className="text-sm font-medium leading-none"
            >
              Attachment (optional, PDF)
            </label>
            {isEditing && application?.attachment_key && (
              <p className="text-xs text-muted-foreground">
                The current attachment is kept unless you choose a replacement PDF.
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                id="pdf-attachment"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="peer sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.type !== "application/pdf") {
                    toast.error("Invalid file type", { description: "Only PDF files are allowed" });
                    e.target.value = "";
                    return;
                  }
                  setAttachmentFile(file);
                }}
              />
              <label
                htmlFor="pdf-attachment"
                className="flex h-10 max-w-[240px] cursor-pointer items-center gap-2 rounded-lg border border-input bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
              >
                <PaperclipIcon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {attachmentFile ? attachmentFile.name : "Choose PDF…"}
                </span>
              </label>
              {attachmentFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setAttachmentFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove attachment"
                >
                  <XIcon className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={resetForm}
              aria-label="Reset form"
            >
              <Trash2Icon className="size-4" />
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} aria-busy={form.formState.isSubmitting}>
              {isEditing ? (
                <PencilIcon className="size-4" aria-hidden="true" />
              ) : (
                <SquarePlusIcon className="size-4" aria-hidden="true" />
              )}
              {form.formState.isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Save application"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
