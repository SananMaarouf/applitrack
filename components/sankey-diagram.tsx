"use client";
import { ResponsiveSankey } from "@nivo/sankey"
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
export function SankeyDiagram() {
	const aggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.aggregatedStatusHistory);

	// Map JobStatus enum to status names and chart variable numbers
	const nodes = [
		{ id: "Applied", nodeColor: "hsl(224, 100%, 58%)" },
		{ id: "Interview", nodeColor: "hsl(33, 100%, 50%)" },
		{ id: "2nd Interview", nodeColor: "hsl(191, 100%, 52%)" },
		{ id: "3rd Interview", nodeColor: "hsl(275, 100%, 50%)" },
		{ id: "Offer", nodeColor: "hsl(73, 100%, 45%)" },
		{ id: "Rejected", nodeColor: "hsl(339, 100%, 50%)" },
		{ id: "Ghosted", nodeColor: "hsl(195, 49%, 84%)" }
	];

	// Build links from aggregatedStatusHistory
	const links = aggregatedStatusHistory.map(item => ({
		source: String(item.From),
		target: String(item.To),
		value: Number(item.Weight)
	}));

	const sankeyData = { nodes, links };
	return (
		<div className="w-full mx-auto">
			<div className="bg-card text-card-foreground p-3 min-h-96 rounded-lg border hover:border-gray-500 transition-all duration-300">
				{links.length > 1 ? (
					<ResponsiveSankey 
						data={sankeyData}
						margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
						align="justify"
						colors={{ datum: 'nodeColor' }}
						nodeOpacity={1}
						nodeHoverOthersOpacity={0.35}
						nodeThickness={18}
						nodeSpacing={24}
						nodeBorderWidth={0}
						nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
						nodeBorderRadius={3}
						linkOpacity={0.7}
						linkHoverOthersOpacity={0.1}
						linkContract={3}
						enableLinkGradient={true}
						labelPosition="outside"
						labelOrientation="vertical"
						labelPadding={16}
						labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
					/>
				) : (
					<p className="text-center py-10 text-muted-foreground">No application history data available</p>
				)}
			</div>
		</div>
	);
}