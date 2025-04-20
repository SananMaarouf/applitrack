import { Calendar } from "./ui/calendar";
import { useForm } from "react-hook-form";
import { ApplicationForm } from "@/types";
import { CalendarIcon, Plus } from "lucide-react";
import { format, isBefore } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { createApplication } from "@/api/crud";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const JobApplicationForm = () => {
  const { toast } = useToast();
  const form = useForm<ApplicationForm>();

  const handleSubmit = async (data: ApplicationForm) => {
    try {
      // Consolidate required field checks
      const requiredFields = [
        { key: "position", label: "position" },
        { key: "company", label: "company" },
        { key: "applied_at", label: "applied at" },
      ];

      for (const field of requiredFields) {
        if (!data[field.key as keyof ApplicationForm]) {
          toast({
            title: "Missing Required Field",
            description: `Please fill in the ${field.label} field.`,
            duration: 6000,
            variant: "destructive",
          });
          return; // Stop form submission
        }
      }

      // Validate dates if both exist
      if (data.applied_at && data.expires_at) {
        const appliedDate = new Date(data.applied_at);
        const expiryDate = new Date(data.expires_at);

        if (isBefore(expiryDate, appliedDate)) {
          toast({
            title: "Invalid Date Range",
            description: "Expiry date cannot be before application date.",
            duration: 5000,
            variant: "destructive",
          });
          return; // Stop form submission
        }
      }

      const formattedData = {
        ...data,
        applied_at: data.applied_at ? format(new Date(data.applied_at), "yyyy-MM-dd") : undefined,
        expires_at: data.expires_at ? format(new Date(data.expires_at), "yyyy-MM-dd") : undefined,
      };

      await createApplication(formattedData);
      console.log("Job application added successfully:", formattedData);
      toast({
        title: "Success",
        description: "Job application added successfully.",
        duration: 2000,
      });

      // Reset form after successful submission
      form.reset({
        position: "",
        company: "",
        link: "",
        applied_at: undefined,
        expires_at: undefined,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add job application.",
        duration: 5000,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full grow bg-card border text-lg rounded-lg flex flex-col hover:border hover:border-gray-500 duration-1000">
      <h2 className="text-2xl font-bold text-center pt-2"> Add Job Application</h2>
      <Form {...form} >
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-grow">
          <div className="flex flex-col gap-2 p-2 flex-grow ">
            <FormField control={form.control} name="position" render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel> {/* TODO: Make required */}
                <FormControl>
                  <Input placeholder="Supreme leader" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            />
            <FormField control={form.control} name="company" render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="BlackRock" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            />
            <div className="flex flex-row gap-2">
              <div className="w-full md:w-1/2">
                <FormField control={form.control} name="applied_at" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Applied At</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full text-left bg-transparent border-2">
                            {field.value ? (
                              format(field.value, "P")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          className="bg-card border-2 border-foreground rounded-md"
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
                />
              </div>
              <div className="w-full md:w-1/2">
                <FormField control={form.control} name="expires_at" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full text-left bg-transparent border-2">
                            {field.value ? (
                              format(field.value, "P")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          className="bg-card border-2 border-foreground rounded-md"
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
                />
              </div>
            </div>
            <FormField control={form.control} name="link" render={({ field }) => (
              <FormItem>
                <FormLabel>Link (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Link to job posting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            />
          </div>
          <div className="flex justify-end p-2">
            <Button className="w-24 text-card bg-btn hover:bg-btn-add hover:text-secondary transition-colors duration-300" type="submit">
              <Plus />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default JobApplicationForm;