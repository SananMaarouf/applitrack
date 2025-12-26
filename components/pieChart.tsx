"use client";
import { JobApplication } from "../types/jobApplication";
import { useJobsStore } from "@/store/jobsStore";
import { Label, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useState, useEffect } from "react";
import { JobStatus } from "@/types/jobStatus";

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
  jobs: {
    label: "Job applications",
  },
  applied: {
    label: "applied",
    color: statusColors[JobStatus.APPLIED],
  },
  interview: {
    label: "interview",
    color: statusColors[JobStatus.INTERVIEW],
  },
  second_interview: {
    label: "second interview",
    color: statusColors[JobStatus.SECOND_INTERVIEW],
  },
  third_interview: {
    label: "third interview",
    color: statusColors[JobStatus.THIRD_INTERVIEW],
  },
  offer: {
    label: "offer",
    color: statusColors[JobStatus.OFFER],
  },
  rejected: {
    label: "rejected",
    color: statusColors[JobStatus.REJECTED],
  },
  ghosted: {
    label: "ghosted",
    color: statusColors[JobStatus.GHOSTED],
  },
}


export function Chart() {
  const [loading, setLoading] = useState(true); // Add loading state
  const jobApplications: JobApplication[] = useJobsStore((state) => state.jobApplications);

  useEffect(() => {
    if (jobApplications.length > 0 || loading) {
      setLoading(false); // Set loading to false once data is available
    }
  }, [jobApplications, loading]);

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
    <div className="h-full grow">
      <Card className="flex flex-col h-full grow">
        {loading ? (
          <div className="text-center min-h-96 text-background font-bold flex items-center justify-center">
            <p>Loading job applications...</p>
          </div>
        ) : (
          <>
            <CardHeader className="items-center">
              <CardTitle className="font-bold text-lg">Applications</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              {jobApplications.length === 0 ? (
                // No job applications
                <p className="text-center text-background my-10">You have no job applications</p>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-92 lg:max-h-112"
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
              )}

            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}