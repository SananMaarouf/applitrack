import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useJobsStore } from "@/store/jobsStore";
import { JobStatus } from "@/types/jobStatus";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

const chartConfig = {
  applications: {
    label: "Applications",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function formatStatusLabel(status: JobStatus): string {
  const normalizedStatus = JobStatus[status].replaceAll("_", " ").toLowerCase();

  if (normalizedStatus === "second interview") return "2nd interview";
  if (normalizedStatus === "third interview") return "3rd interview";

  return normalizedStatus;
}

export function RadarStatusChart() {
  const jobApplications = useJobsStore((state) => state.jobApplications);

  const statusCounts = jobApplications.reduce<Record<number, number>>((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.values(JobStatus)
    .filter((status): status is JobStatus => typeof status === "number")
    .map((status) => ({
      status: formatStatusLabel(status),
      applications: statusCounts[status] || 0,
    }));

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center ">
        <CardTitle className="font-bold text-lg">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {jobApplications.length === 0 ? (
          <p className="text-center my-10">No data to visualize yet</p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto max-h-48 w-full">
            <RadarChart data={chartData} className="text-foreground">
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <PolarAngleAxis dataKey="status" tick={{ fill: "var(--background)", fontSize: 12 }} />
              <PolarGrid stroke="var(--card-foreground)"  />
              <Radar
                dataKey="applications"
                fill="var(--primary)"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}