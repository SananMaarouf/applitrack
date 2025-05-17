"use client";
import { Chart } from "react-google-charts";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { useEffect, useState } from "react";

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
export function SankeyDiagram() {
	const [fontSize, setFontSize] = useState(0);

	useEffect(() => {
		const handleResize = () => {
			// Tailwind's md breakpoint is 768px
			setFontSize(window.innerWidth < 768 ? 11 : 18);
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const options = {
		sankey: {
			iterations:60,
			node: {
				label: {
					fontSize,
					color: "#201d1f",
					bold: true,
				},
				labelPadding: 1,
				nodePadding: 50,
				width: 5,
				interactivity: true,
			},
			link: {
				colorMode: "gradient",
				colors: [
					"#36a2eb", "#ff9f40", "#4bc0c0","#9966ff", "#9966ff", "#4caf50", "#ff6384","#bdbdbd",
				],
			},
		},
	};

	const aggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.aggregatedStatusHistory);
	const sankeyData = [
		["From", "To", "Amount"],
		...aggregatedStatusHistory.map(item => [
			item.From,
			item.To,
			Number(item.Weight)
		])
	];
	console.log("sankeyData", sankeyData);
	return (
		<div className="w-full mx-auto">
			<div className="bg-card text-card-foreground p-3 rounded-lg border hover:border-gray-500 transition-all duration-300">
				{sankeyData.length > 1 ? (
					<Chart
						className="w-full h-[350px] lg:h-[500px]"
						chartType="Sankey"
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