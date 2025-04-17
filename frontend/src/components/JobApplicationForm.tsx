import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createApplication } from "@/api/crud";
import { ApplicationForm } from "@/types";

const JobApplicationForm = () => {
  const { toast } = useToast();
  const form = useForm<ApplicationForm>();

  const handleSubmit = async (data: ApplicationForm) => {
    try {
      await createApplication(data);
      toast({
        title: "Success",
        description: "Job application added successfully.",
        duration: 2000,
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
      <h2
        className="text-2xl font-bold text-center pt-2">
        Add Job Application
      </h2>
      <Form {...form} >
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col flex-grow"
        >
          <div className="flex flex-col gap-2 p-2 flex-grow ">
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Supreme leader" {...field} />
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
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="BlackRock" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row space-x-4">
              <div className="w-1/2">
                <FormField
                  control={form.control}
                  name="applied_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applied At</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-1/2">
                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
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
            <Button 
            className="w-full md:w-24 text-card bg-btn hover:bg-btn-add hover:text-secondary transition-colors duration-300" type="submit">
              Add
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default JobApplicationForm;