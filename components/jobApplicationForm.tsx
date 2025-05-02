"use client"

import { z } from "zod";
import { format } from "date-fns"
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"
import { zodResolver } from "@hookform/resolvers/zod";
import { saveJobApplicationAction } from "@/app/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast";
import { useJobsStore } from "@/store/jobsStore";
import { JobApplication } from "@/types/jobApplication";

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
  const { toast } = useToast();

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
          jobsStore.setJobs([...response.data as JobApplication[], ...jobsStore.jobApplications ]);
  
          toast({
            title: "Success",
            description: "Job application saved successfully",
            variant: "default",
          });
  
          // Reset the form after successful submission
          form.reset();
  
        } else {
          toast({
            title: "Error",
            description: response.message,
            variant: "destructive",
          });
        }
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "An error occurred while saving the job application",
          variant: "destructive",
        });
        console.error("Error saving job application:", error);
      });
  }

  return (
    <div className="bg-card h-full text-card-foreground p-4 rounded-md border hover:border-gray-500 transition-all duration-700">
      <h2 className="text-lg font-semibold text-center">Job Application</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="position" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-card-foreground">Position*</FormLabel>
              <FormControl>
                <input {...field} className="mt-1 text-foreground p-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50" />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )} />
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-card-foreground">Company*</FormLabel>
              <FormControl>
                <input {...field} className="mt-1 text-foreground p-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50" />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )} />
          <FormField control={form.control} name="applied_at" render={({ field }) => (
            <FormItem>
              <FormLabel>Date Applied*</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="default" className="w-full text-left">
                    {field.value ? format(field.value, "PP") : "Select a date"}
                    <CalendarIcon className="ml-2 h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={field.value} onSelect={(date) => {
                    field.onChange(date!);
                  }} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="expires_at" render={({ field }) => (
            <FormItem>
              <FormLabel>Date Expires (optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="default" className="w-full text-left">
                    {field.value ? format(field.value, "PPP") : "Select a date"}
                    <CalendarIcon className="ml-2 h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={field.value} onSelect={(date) => {
                    field.onChange(date!);
                  }} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="link" render={({ field }) => (
            <FormItem>
              <FormLabel>Link (optional)</FormLabel>
              <FormControl>
                <input {...field} className="mt-1 text-foreground p-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              variant={"add"} 
              className="mt-2 w-1/3 md:w-36">
                <Plus className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
