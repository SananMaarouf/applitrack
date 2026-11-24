"use client";

import { z } from "zod";
import { format, parse, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useJobsStore } from "@/store/jobsStore";
import { CalendarIcon, PaperclipIcon, Trash2Icon, SquarePlusIcon, XIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { createApplication } from "@/api/applications";
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

export function JobApplicationForm({ user_id, onClose }: { user_id: string; onClose?: () => void }) {
  const { getToken } = useAuth();
  const [appliedDateOpen, setAppliedDateOpen] = useState(false);
  const [expiresDateOpen, setExpiresDateOpen] = useState(false);
  const [appliedDateText, setAppliedDateText] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expiresDateText, setExpiresDateText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: "",
      company: "",
      applied_at: new Date(),
      expires_at: undefined,
      link: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      let created = await createApplication(token, {
        position: data.position,
        company: data.company,
        applied_at: new Date(data.applied_at).toISOString(),
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
        link: data.link || null,
      });

      // Upload the PDF attachment if one was selected
      if (attachmentFile) {
        try {
          created = await uploadAttachment(token, (created as any).id, attachmentFile);
        } catch (attachErr: any) {
          toast.warning("Application saved, but attachment upload failed", {
            description: attachErr?.message || "Could not upload the PDF",
          });
        }
      }

      const jobsStore = useJobsStore.getState();
      jobsStore.setJobs([created as any, ...jobsStore.jobApplications]);

      toast.success("Job application saved successfully", {
        description: "Your application has been registered",
      });

      form.reset();
      setAppliedDateText(format(new Date(), "yyyy-MM-dd"));
      setExpiresDateText("");
      setAttachmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
            Register application
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add a role and keep its progress up to date.
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
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        setAppliedDateText(dateStr);
                        if (dateStr.length === 10) {
                          const parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
                          if (isValid(parsedDate)) {
                            field.onChange(parsedDate);
                          }
                        } else if (dateStr === "") {
                          field.onChange(undefined);
                        }
                      }}
                      onBlur={() => {
                        if (field.value) {
                          setAppliedDateText(format(field.value, "yyyy-MM-dd"));
                        } else {
                          setAppliedDateText("");
                        }
                      }}
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
                          if (date) {
                            setAppliedDateText(format(date, "yyyy-MM-dd"));
                          }
                          setTimeout(() => {
                            setAppliedDateOpen(false);
                          }, 500);
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
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        setExpiresDateText(dateStr);
                        if (dateStr.length === 10) {
                          const parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
                          if (isValid(parsedDate)) {
                            field.onChange(parsedDate);
                          }
                        } else if (dateStr === "") {
                          field.onChange(undefined);
                        }
                      }}
                      onBlur={() => {
                        if (field.value) {
                          setExpiresDateText(format(field.value, "yyyy-MM-dd"));
                        } else {
                          setExpiresDateText("");
                        }
                      }}
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
                          if (date) {
                            setExpiresDateText(format(date, "yyyy-MM-dd"));
                          }
                          setTimeout(() => {
                            setExpiresDateOpen(false);
                          }, 500);
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
              onClick={() => {
                form.reset();
                setAppliedDateText(format(new Date(), "yyyy-MM-dd"));
                setExpiresDateText("");
                setAttachmentFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              aria-label="Reset form"
            >
              <Trash2Icon className="size-4" />
            </Button>
            <Button type="submit">
              <SquarePlusIcon className="size-4" aria-hidden="true" />
              Save application
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
