import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

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
    <Card className="flex h-full flex-col p-0">
      <CardHeader className="hidden items-center md:flex">
        <CardTitle className="font-bold text-sm lg:text-lg">Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {jobApplications.length === 0 ? (
          <p className="text-center my-10">No data to visualize yet</p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-full w-full aspect-square sm:min-h-64 md:aspect-video"
          >
            <RadarChart
              data={chartData}
              outerRadius={isMobile ? "94%" : "84%"}
              margin={
                isMobile
                  ? { top: 8, right: 8, bottom: 8, left: 8 }
                  : { top: 14, right: 28, bottom: 14, left: 28 }
              }
              className="text-foreground h-full w-full"
            >
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <PolarAngleAxis
                dataKey="status"
                className="hidden md:block"
                tick={{ fill: "var(--card-foreground)", fontSize: 12 }}
              />
              <PolarGrid stroke="var(--card-foreground)" />
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