import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartLegend,
  ChartLegendContent,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useJobsStore } from "@/store/jobsStore";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartConfig = {
  applications: {
    label: "Applications",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function BarStatusChart() {
  const jobApplications = useJobsStore((state) => state.jobApplications);

  const monthlyCounts = jobApplications.reduce<Record<string, number>>((acc, job) => {
    // `applied_at` is a date-like string (YYYY-MM-DD), so slice keeps month key stable.
    const monthKey = job.applied_at.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(monthKey)) return acc;
    acc[monthKey] = (acc[monthKey] || 0) + 1;
    return acc;
  }, {});

  const monthKeys = Object.keys(monthlyCounts).sort((a, b) => a.localeCompare(b));

  const toMonthDate = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1));
  };

  const toMonthKey = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const currentYear = new Date().getUTCFullYear();
  const yearEnd = new Date(Date.UTC(currentYear, 11, 1)); // December of current year

  const chartData =
    monthKeys.length === 0
      ? []
      : (() => {
          const start = toMonthDate(monthKeys[0]);
          const end = yearEnd;
          const points: Array<{ month: string; applications: number }> = [];

          const cursor = new Date(start);
          while (cursor <= end) {
            const month = toMonthKey(cursor);
            points.push({ month, applications: monthlyCounts[month] ?? 0 });
            cursor.setUTCMonth(cursor.getUTCMonth() + 1);
          }

          return points;
        })();

  const tooltipLabelFormatter = (label: string) => {
    const date = new Date(`${label}-01`);
    return date.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const axisTickFormatter = (value: string) => {
    const date = new Date(`${value}-01`);
    return date.toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const tooltipContent = (
    <ChartTooltipContent hideLabel labelFormatter={(value) => tooltipLabelFormatter(String(value))} />
  );

  const chartPoints = chartData.map(({ month, applications }) => ({
      month,
      applications,
    }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-bold text-sm lg:text-lg">Applications over time</CardTitle>
      </CardHeader>
      <CardContent>
        {jobApplications.length === 0 ? (
          <p className="text-center text-background my-10">No data to visualize yet</p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto w-full max-h-64">
            <BarChart accessibilityLayer data={chartPoints}>
              <CartesianGrid vertical={false} stroke="var(--card-foreground)" />
              <XAxis
                dataKey="month"
                angle={30}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ style: { fill: 'var(--card-foreground)', fontSize: 12 } }}
                tickFormatter={(value) => axisTickFormatter(String(value))}
              />
              <ChartTooltip cursor={false} content={tooltipContent} />
              <Bar dataKey="applications" fill="var(--primary)" radius={8} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}