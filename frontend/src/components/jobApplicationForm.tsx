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
    <div className="bg-foreground w-full rounded-md p-3 text-background sm:p-4">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <h2 className="text-base font-bold sm:text-lg">Register application</h2>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden text-background/80 hover:text-background md:inline-flex"
            onClick={onClose}
            aria-label="Close form"
          >
            <XIcon className="size-5" />
          </Button>
        )}
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">Position*</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-primary p-1.5 text-sm text-primary-foreground shadow-xs focus:ring-3 focus:ring-opacity-50 sm:p-2"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">Company*</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-primary p-1.5 text-sm text-primary-foreground shadow-xs focus:ring-3 focus:ring-opacity-50 sm:p-2"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="applied_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">Date Applied*</FormLabel>
                <div className="flex gap-1.5 sm:gap-2">
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
                      className="h-9 bg-primary text-sm text-primary-foreground sm:h-10"
                    />
                  </FormControl>
                  <Popover open={appliedDateOpen} onOpenChange={setAppliedDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="default" size="icon" type="button" className="h-9 w-9 sm:h-10 sm:w-10">
                        <CalendarIcon className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-1">
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
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">Date Expires (optional)</FormLabel>
                <div className="flex gap-1.5 sm:gap-2">
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
                      className="h-9 bg-primary text-sm text-primary-foreground sm:h-10"
                    />
                  </FormControl>
                  <Popover open={expiresDateOpen} onOpenChange={setExpiresDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="default" size="icon" type="button" className="h-9 w-9 sm:h-10 sm:w-10">
                        <CalendarIcon className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-1">
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
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">Link (optional)</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    className="block w-full rounded-md border-gray-300 bg-primary p-1.5 text-sm text-primary-foreground shadow-xs focus:ring-3 focus:ring-opacity-50 sm:p-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* PDF attachment */}
          <div className="space-y-1">
            <label className="text-xs font-medium leading-none sm:text-sm">Attachment (optional, PDF)</label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="pdf-attachment"
                className="flex cursor-pointer items-center gap-2 rounded-md bg-primary px-2.5 py-1.5 text-xs text-primary-foreground transition-opacity hover:opacity-80 sm:px-3 sm:py-2 sm:text-sm"
              >
                <PaperclipIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {attachmentFile ? attachmentFile.name : "Choose PDF…"}
              </label>
              <input
                id="pdf-attachment"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
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
              {attachmentFile && (
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Remove attachment"
                >
                  <XIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-row justify-between">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => {
                form.reset();
                setAppliedDateText(format(new Date(), "yyyy-MM-dd"));
                setExpiresDateText("");
                setAttachmentFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <Trash2Icon className="size-5" />
            </Button>
            <Button className="px-8 sm:px-10" type="submit" variant="default" size="icon">
              <SquarePlusIcon className="size-6" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
