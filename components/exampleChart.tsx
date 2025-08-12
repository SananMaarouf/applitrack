"use client";
import { JobApplication } from "../types/jobApplication";
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
    "status": 6,
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
    "status": 7,
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
  [JobStatus.APPLIED]: "var(--color-applied)",
  [JobStatus.INTERVIEW]: "var(--color-interview)",
  [JobStatus.SECOND_INTERVIEW]: "var(--color-second-interview)",
  [JobStatus.THIRD_INTERVIEW]: "var(--color-third-interview)",
  [JobStatus.OFFER]: "var(--color-offer)",
  [JobStatus.REJECTED]: "var(--color-rejected)",
  [JobStatus.GHOSTED]: "var(--color-ghosted)",
};

const chartConfig: ChartConfig = {
  jobs: { label: "Job applications" },
  applied: { label: "applied", color: "hsl(var(--chart-1))" },
  interview: { label: "interview", color: "hsl(var(--chart-2))" },
  second_interview: { label: "second interview", color: "hsl(var(--chart-3))" },
  third_interview: { label: "third interview", color: "hsl(var(--chart-4))" },
  offer: { label: "offer", color: "hsl(var(--chart-5))" },
  rejected: { label: "rejected", color: "hsl(var(--chart-6))" },
  ghosted: { label: "ghosted", color: "hsl(var(--chart-7))" },
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
    <Card className="flex flex-col border-2 border-card-foreground bg-card h-fit w-full transition-all duration-700">
      <CardHeader className="items-center">
        <CardTitle className="font-bold text-lg text-btn">Applications</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square min-h-[100px] max-h-[250px] lg:min-h-[200px] lg:max-h-[400px]">
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