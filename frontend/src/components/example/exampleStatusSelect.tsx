import { useEffect, useState } from "react";
import { toast } from "sonner";
import { JobApplication } from "@/types/jobApplication";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatus } from "@/types/jobStatus";

// Define the type for the "row" object
interface Row {
	original: JobApplication;
}

export function ExampleStatusSelect({ row }: { row: Row }) {
	const [status, setStatus] = useState(row.original.status.toString());

	useEffect(() => {
		setStatus(row.original.status.toString());
	}, [row.original.status]);

	const updateJobStatus = async (nextStatus: string) => {
		setStatus(nextStatus);
		toast.success("This is a successful status update toast!");
	};

	return (
		<span>
			<Select value={status} onValueChange={updateJobStatus}>
				<SelectTrigger className="bg-primary text-primary-foreground">
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="">
					<SelectItem className="" value={JobStatus.APPLIED.toString()}>Applied</SelectItem>
					<SelectItem className="" value={JobStatus.INTERVIEW.toString()}>Interview</SelectItem>
					<SelectItem className="" value={JobStatus.SECOND_INTERVIEW.toString()}>Second Interview</SelectItem>
					<SelectItem className="" value={JobStatus.THIRD_INTERVIEW.toString()}>Third Interview</SelectItem>
					<SelectItem className="" value={JobStatus.OFFER.toString()}>Offer</SelectItem>
					<SelectItem className="" value={JobStatus.REJECTED.toString()}>Rejected</SelectItem>
					<SelectItem className="" value={JobStatus.GHOSTED.toString()}>Ghosted</SelectItem>
				</SelectContent>
			</Select>
		</span>
	);
}