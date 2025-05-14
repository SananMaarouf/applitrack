"use client";
import { Chart } from "react-google-charts";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";

// Define an enum for job application statuses
export enum JobStatus {
	APPLIED = 1,
	INTERVIEW = 2,
	SECOND_INTERVIEW = 3,
	THIRD_INTERVIEW = 4,
	OFFER = 5,
	REJECTED = 6,
	GHOSTED = 7
}


export const options = {
	sankey: {
		node: {
			colors: ["#36a2eb", "#ff6384", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#4caf50"],
			label: {
				fontSize: 14,
				bold: true,
				color: "white",
			}
		},
		link: {
			colorMode: "target",
			colors: ["#36a2eb", "#ff6384", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#4caf50"],
		},
	},
};

export function SankeyDiagram() {

	const aggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.aggregatedStatusHistory);

	const sankeyData = [
		["From", "To", "Weight"],
		...aggregatedStatusHistory.map(item => [
			item.From,
			item.To,
			Number(item.Weight)
		])
	];

	return (
		<div className="w-full mx-auto">
			<div className="bg-card text-card-foreground p-3 rounded-lg border hover:border-gray-500 transition-all duration-300">
				{sankeyData.length > 1 ? (
					<Chart
						chartType="Sankey"
						width="100%"
						height="400px"
						loader={<div>Loading Chart</div>}
						data={sankeyData}
						options={options}
					/>
				) : (
					<p className="text-center py-10 text-muted-foreground">No application history data available</p>
				)}
			</div>
		</div>
	);
}