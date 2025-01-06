import { motion } from "motion/react";
import { useToast } from "@/hooks/use-toast";

export default function JobApplicationForm (){
  const { toast } = useToast();

  /* get state from zustand store */
  const jobApplications = useStore((state) => state.jobApplications);
  const user = useStore((state) => state.user);

  /* set state in zustand */
  const setJobApplications = useStore((state) => state.setJobApplications);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const response = await registerJobApplication(formData, user!.id);

    if (response.error) {
      toast({
        title: "Error",
        description: response.error || "An error occurred while adding the job application.",
        duration: 5000,
        variant: "destructive",
      });
      return;
    }

    // Update the Zustand store with the new job application
    setJobApplications([...jobApplications, response?.record as any]);    
    toast({
      title: "Success",
      description: "Job application added successfully.",
      duration: 2000,
    });
  };

  return (
    <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
      <div className="border border-b bg-card rounded-lg h-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-[1.6rem] text-black">
          <div className="flex flex-col">
            <label htmlFor="position" className="text-white text-2xl font-semibold">
              Position
            </label>
            <input type="text" name="position" placeholder="Supreme leader" required className="border p-2" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="company" className="text-white text-2xl font-semibold">
              Company
            </label>
            <input type="text" name="company" placeholder="BlackRock" required className="border p-2" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="applied_at" className="text-white text-2xl font-semibold">
              Applied At
            </label>
            <input type="date" name="applied_at" placeholder="Date" required className="border p-2" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="expires_at" className="text-white text-2xl font-semibold">
              Expiry Date
            </label>
            <input type="date" name="expires_at" placeholder="Expiry Date" required className="border p-2" />
          </div>
          <div className="flex flex-col">
            <label htmlFor="link" className="text-white text-2xl font-semibold">
              Link (optional)
            </label>
            <input type="text" name="link" placeholder="link to job posting" className="border p-2" />
          </div>
          <button type="submit" className="bg-green-800 rounded-sm hover:bg-green-600 font-semibold text-xl text-white p-2">
            Submit
          </button>
        </form>
      </div>
    </motion.div>
  );
};