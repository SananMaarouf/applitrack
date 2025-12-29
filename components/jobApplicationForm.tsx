"use client"

import { z } from "zod";
import { format, parse, isValid } from "date-fns"
import { Button } from "./ui/button";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useJobsStore } from "@/store/jobsStore";
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { JobApplication } from "@/types/jobApplication";
import { saveJobApplicationAction } from "@/app/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  position: z.string().min(1, {
    message: "Position is required"
  }),
  company: z.string().min(1, {
    message: "Company name is required"
  }),
  applied_at: z.date({
    required_error: "Date applied is required",
    invalid_type_error: "Date applied must be a valid date"
  }),
  expires_at: z.date({
    required_error: "Date expires is required",
    invalid_type_error: "Date expires must be a valid date"
  }).optional(),
  link: z.string().optional(),
  status: z.number()
});

export function JobApplicationForm({ user_id }: { user_id: string }) {

  const [appliedDateOpen, setAppliedDateOpen] = useState(false);
  const [expiresDateOpen, setExpiresDateOpen] = useState(false);
  const [appliedDateText, setAppliedDateText] = useState("");
  const [expiresDateText, setExpiresDateText] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: "",
      company: "",
      applied_at: new Date(),
      expires_at: undefined,
      link: "",
      status: 1,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    const formattedData = {
      ...data,
      user_id, // Include the userId in the submitted data
      applied_at: format(new Date(data.applied_at), "yyyy-MM-dd"), // Format applied_at to keep only the date
      expires_at: data.expires_at ? format(new Date(data.expires_at), "yyyy-MM-dd") : undefined, // Format expires_at to keep only the date
    };

    const formData = new FormData();

    Object.entries(formattedData).forEach(([key, value]) => {
      if (value !== undefined) { formData.append(key, value.toString()) }
    });

    saveJobApplicationAction(formData)
      .then((response) => {
        if (response.success) {

          // Update Zustand store with the new application from the response
          const jobsStore = useJobsStore.getState();
          jobsStore.setJobs([...(response.data || []), ...jobsStore.jobApplications]);

          toast.success("Job application saved successfully", {
            description: "Your application has been registered",
          });

          // Reset the form after successful submission
          form.reset();
          setAppliedDateText("");
          setExpiresDateText("");

        } else {
          toast.error("Error", {
            description: response.message,
          });
        }
      })
      .catch((error) => {
        toast.error("Error", {
          description: "An error occurred while saving the job application",
        });
        console.error("Error saving job application:", error);
      });
  }

  return (
    <div className="bg-foreground h-full text-background p-4 rounded-md ">
      <h2 className="text-lg font-bold text-center">Register application</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="position" render={({ field }) => (
            <FormItem>
              <FormLabel className="">Position*</FormLabel>
              <FormControl>
                <input {...field} className="mt-1 text-primary-foreground bg-primary p-2 block w-full border-gray-300 rounded-md shadow-xs focus:ring-3 focus:ring-opacity-50" />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )} />
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormLabel className="">Company*</FormLabel>
              <FormControl>
                <input {...field} className="mt-1 text-primary-foreground bg-primary p-2 block w-full border-gray-300 rounded-md shadow-xs focus:ring-3 focus:ring-opacity-50" />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )} />
          <FormField control={form.control} name="applied_at" render={({ field }) => (
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
                      // Only update form field if it's a complete, valid date (YYYY-MM-DD format)
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
                      // Sync text with field value on blur
                      if (field.value) {
                        setAppliedDateText(format(field.value, "yyyy-MM-dd"));
                      } else {
                        setAppliedDateText("");
                      }
                    }}
                    className="text-primary-foreground bg-primary"
                  />
                </FormControl>
                <Popover open={appliedDateOpen} onOpenChange={setAppliedDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="default" size="icon" type="button">
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
          )} />

          <FormField control={form.control} name="expires_at" render={({ field }) => (
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
                      // Only update form field if it's a complete, valid date (YYYY-MM-DD format)
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
                      // Sync text with field value on blur
                      if (field.value) {
                        setExpiresDateText(format(field.value, "yyyy-MM-dd"));
                      } else {
                        setExpiresDateText("");
                      }
                    }}
                    className="text-primary-foreground bg-primary"
                  />
                </FormControl>
                <Popover open={expiresDateOpen} onOpenChange={setExpiresDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="default" size="icon" type="button">
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
          )} />
          <FormField control={form.control} name="link" render={({ field }) => (
            <FormItem>
              <FormLabel>Link (optional)</FormLabel>
              <FormControl>
                <input {...field} className="text-primary-foreground bg-primary p-2 block w-full border-gray-300 rounded-md shadow-xs focus:ring-3 focus:ring-opacity-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex flex-row justify-between">
            <Button
              type="button"
              variant={"outline"}
              onClick={() => {
                form.reset();
                setAppliedDateText("");
                setExpiresDateText("");
              }}
              className="cursor-pointer hover:scale-105 mt-2 w-1/3 md:w-36">
              Reset
            </Button>
            <Button
              type="submit"
              variant={"default"}
              className="cursor-pointer hover:scale-105 mt-2 w-1/3 md:w-36">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
