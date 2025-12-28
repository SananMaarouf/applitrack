"use client";
import { JobApplication } from "../../types/jobApplication";
import { Label, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { JobStatus } from "@/types/jobStatus";

// Mock data
const mockJobApplications: JobApplication[] = [
  {
    "id": 7,
    "user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
    "created_at": "2025-08-06T23:47:13.981503+00:00",
    "applied_at": "2025-08-07",
    "expires_at": undefined,
    "position": "test 4",
    "company": "test 4",
    "status": 1,
    "link": ""
  },
  {
    "id": 6,
    "user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
    "created_at": "2025-08-06T23:44:07.972831+00:00",
    "applied_at": "2025-08-07",
    "expires_at": undefined,
    "position": "test 2",
    "company": "test 3",
    "status": 2,
    "link": ""
  },
  {
    "id": 5,
    "user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
    "created_at": "2025-08-06T23:05:50.116898+00:00",
    "applied_at": "2025-08-07",
    "expires_at": undefined,
    "position": "test 2",
    "company": "test 2",
    "status": 6,
    "link": ""
  },
  {
    "id": 4,
    "user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
    "created_at": "2025-08-06T22:57:54.05042+00:00",
    "applied_at": "2025-08-06",
    "expires_at": undefined,
    "position": "test",
    "company": "test",
    "status": 5,
    "link": ""
  }
];

// Define colors for each job status
const statusColors: { [key in JobStatus]: string } = {
  [JobStatus.APPLIED]: "var(--chart-1)",
  [JobStatus.INTERVIEW]: "var(--chart-2)",
  [JobStatus.SECOND_INTERVIEW]: "var(--chart-3)",
  [JobStatus.THIRD_INTERVIEW]: "var(--chart-4)",
  [JobStatus.OFFER]: "var(--chart-5)",
  [JobStatus.REJECTED]: "var(--chart-6)",
  [JobStatus.GHOSTED]: "var(--chart-7)",
};

const chartConfig: ChartConfig = {
  jobs: { label: "Job applications" },
  applied: { label: "applied", color: statusColors[JobStatus.APPLIED] },
  interview: { label: "interview", color: statusColors[JobStatus.INTERVIEW] },
  second_interview: { label: "second interview", color: statusColors[JobStatus.SECOND_INTERVIEW] },
  third_interview: { label: "third interview", color: statusColors[JobStatus.THIRD_INTERVIEW] },
  offer: { label: "offer", color: statusColors[JobStatus.OFFER] },
  rejected: { label: "rejected", color: statusColors[JobStatus.REJECTED] },
  ghosted: { label: "ghosted", color: statusColors[JobStatus.GHOSTED] },
}

export function ExampleChart() {
  const jobApplications = mockJobApplications;

  // Group job applications by status and count them
  const statusCounts: { [key: number]: number } = jobApplications.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  // Transform job applications data for the chart
  const chartData = Object.values(JobStatus)
    .filter((status): status is JobStatus => typeof status === "number")
    .map((status) => ({
      jobs: JobStatus[status].toLowerCase(),
      applications: statusCounts[status] || 0,
      fill: statusColors[status],
    }));

  return (
    <Card className="flex flex-col h-fit w-full">
      <CardHeader className="items-center">
        <CardTitle className="font-bold text-lg">Applications</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square min-h-25 max-h-62.5 lg:min-h-50 lg:max-h-100">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={chartData} dataKey="applications" nameKey="jobs" innerRadius={80} strokeWidth={5} >
              <Label content={({ viewBox }) => {
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
                        className="fill-current text-3xl font-bold"
                      >
                        {jobApplications.length}
                      </tspan>
                    </text>
                  );
                }
                return null;
              }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}