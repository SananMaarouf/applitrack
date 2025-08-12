"use client";
import { useToast } from "@/hooks/use-toast";
import { JobApplication } from "@/types/jobApplication";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatus } from "@/types/jobStatus";

// Define the type for the "row" object
interface Row {
	original: JobApplication;
}

export function ExampleStatusSelect({ row }: { row: Row }) {
	const { toast } = useToast();

	const updateJobStatus = async () => {
		toast({
			title: "Success ✅",
			description: "This is what you would see if status was updated successfully",
			variant: "success",
		});
	};

	return (
		<span>
			<Select value={row.original.status.toString()} onValueChange={() => updateJobStatus()}>
				<SelectTrigger className="bg-primary hover:bg-hover text-primary-foreground hover:text-card-foreground transition-colors duration-300">
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="bg-primary border-2 border-gray-500">
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.APPLIED.toString()}>Applied</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.INTERVIEW.toString()}>Interview</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.SECOND_INTERVIEW.toString()}>Second Interview</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.THIRD_INTERVIEW.toString()}>Third Interview</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.OFFER.toString()}>Offer</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.REJECTED.toString()}>Rejected</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.GHOSTED.toString()}>Ghosted</SelectItem>
				</SelectContent>
			</Select>
		</span>
	);
}