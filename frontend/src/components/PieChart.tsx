
/* import useStore from "@/useStore"
 */import { motion } from "motion/react"
import { JobApplication } from "@/types"
import { useJobsStore } from "@/store/jobsStore"
import { Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Define an enum for job application statuses
enum JobStatus {
	APPLIED = 1,
	INTERVIEW = 2,
	OFFER = 3,
	REJECTED = 4,
	GHOSTED = 5
}

// Define colors for each job status
const statusColors: { [key in JobStatus]: string } = {
	[JobStatus.APPLIED]: "var(--color-applied)",
	[JobStatus.INTERVIEW]: "var(--color-interview)",
	[JobStatus.OFFER]: "var(--color-offer)",
	[JobStatus.REJECTED]: "var(--color-rejected)",
	[JobStatus.GHOSTED]: "var(--color-ghosted)"
};

const chartConfig: ChartConfig = {
	jobs: {
		label: "Job applications",
	},
	applied: {
		label: "applied",
		color: "hsl(var(--chart-1))",
	},
	interview: {
		label: "interview",
		color: "hsl(var(--chart-2))",
	},
	offer: {
		label: "offer",
		color: "hsl(var(--chart-3))",
	},
	rejected: {
		label: "rejected",
		color: "hsl(var(--chart-4))",
	},
	ghosted: {
		label: "ghosted",
		color: "hsl(var(--chart-5))",
	},
}

export function Chart() {
	// Get job applications from Zustand store
	const jobApplications: JobApplication[] = useJobsStore((state) => state.jobApplications);
	
	

	// Group job applications by status and count them
	const statusCounts: { [key: number]: number } = jobApplications.reduce((acc, job) => {
		acc[job.status] = (acc[job.status] || 0) + 1;
		return acc;
	}, {} as { [key: number]: number });

	// Transform job applications data for the chart
	const chartData = Object.values(JobStatus)
		.filter((status): status is JobStatus => typeof status === "number")
		.map(status => ({
			jobs: JobStatus[status].toLowerCase(),
			applications: statusCounts[status] || 0,
			fill: statusColors[status]
		}));

	return (
		<motion.div
			initial={{ x: -100, opacity: 0 }}
			animate={{ x: 0, opacity: 1 }}
			className="h-full grow"
		>
			<Card className="flex flex-col bg-card h-full grow ">
				<CardHeader className="items-center">
					<CardTitle>Job applications</CardTitle>
				</CardHeader>
				<CardContent className="flex-1 pb-0 ">
					{jobApplications.length === 0 ? (
						<p className="text-center text-muted-foreground my-10">You have no job applications</p>
					) : (
						<ChartContainer
							config={chartConfig}
							className="mx-auto aspect-square max-h-[23rem] lg:max-h-[28rem]"
						>
							<PieChart>
								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent hideLabel />}
								/>
								<Pie
									data={chartData}
									dataKey="applications"
									nameKey="jobs"
									innerRadius={60}
									strokeWidth={5}
								>
									<Label
										content={({ viewBox }) => {
											if (viewBox && "cx" in viewBox && "cy" in viewBox) {
												return (
													<text
														x={viewBox.cx}
														y={viewBox.cy}
														textAnchor="middle"
														dominantBaseline="middle"
													>
														<tspan
															x={viewBox.cx}
															y={viewBox.cy}
															className="fill-foreground text-3xl font-bold"
														>
															{jobApplications.length}
														</tspan>
														<tspan
															x={viewBox.cx}
															y={(viewBox.cy || 0) + 24}
															className="fill-muted-foreground"
														>
															Applications
														</tspan>
													</text>
												)
											}
											return null;
										}}
									/>
								</Pie>
							</PieChart>
						</ChartContainer>
					)}
				</CardContent>
			</Card>
		</motion.div>
	)
}