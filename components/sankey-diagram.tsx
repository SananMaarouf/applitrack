"use client";
import { ResponsiveSankey } from "@nivo/sankey"
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { useTheme } from "next-themes";
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
	const aggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.aggregatedStatusHistory);
	const { theme } = useTheme();

	// Create nodes from the aggregatedStatusHistory
	const rawNodes = aggregatedStatusHistory.map(item => ({
		source: String(item.From),
		target: String(item.To),
	}));

	const allNodeIds = rawNodes.reduce((acc, curr) => {
		acc.push(curr.source);
		acc.push(curr.target);
		return acc;
	}, [] as string[]);

	const uniqueNodeIds = Array.from(new Set(allNodeIds));

	const nodes = uniqueNodeIds.map(id => {
		let nodeColor = "";
		switch (id) {
			case "Applied":
				nodeColor = "hsl(224, 100%, 58%)";
				break;
			case "Interview":
				nodeColor = "hsl(33, 100%, 50%)";
				break;
			case "2nd Interview":
				nodeColor = "hsl(191, 100%, 52%)";
				break;
			case "3rd Interview":
				nodeColor = "hsl(275, 100%, 50%)";
				break;
			case "Offer":
				nodeColor = "hsl(73, 100%, 45%)";
				break;
			case "Rejected":
				nodeColor = "hsl(339, 100%, 50%)";
				break;
			case "Ghosted":
				nodeColor = "hsl(195, 49%, 84%)";
				break;
			default:
				nodeColor = "hsl(0, 0%, 70%)";
				break;
		}
		return { id, nodeColor };
	});

	// If the device is mobile, limit the number of nodes to 5
	const [labelPosition, setLabelPosition] = useState('outside');

	useEffect(() => {
		const updatePosition = () => {
			setLabelPosition(window.innerWidth < 768 ? 'inside' : 'outside');
		};

		updatePosition();
		window.addEventListener('resize', updatePosition);
		return () => window.removeEventListener('resize', updatePosition);
	}, []);


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
						margin={labelPosition === 'inside'
							? { top: 42, right: 0, bottom: 42, left: 0 }
							: { top: 42, right: 64, bottom: 42, left: 64 }}
						align="justify"
						colors={{ datum: 'nodeColor' }}
						nodeThickness={18}
						nodeSpacing={24}
						linkOpacity={1}
						nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
						enableLinkGradient={true}
						linkBlendMode="normal"
						labelPosition={labelPosition === 'inside' ? 'inside' : 'outside'}
						labelOrientation={labelPosition === 'inside' ? 'vertical' : 'horizontal'}
						labelPadding={10}
						labelTextColor={theme === "light" ? "#fff" : "#222"}
						theme={{
							labels: {
								text: {
									fontSize: '0.8rem',
									fontWeight: "bolder",
								},
							},
							tooltip: {
								container: {
									background: '#333',
									color: '#fff',
									fontSize: '12px',
									padding: '5px',
									borderRadius: '4px',
								},
							},
						}}
					/>
				) : (
					<p className="text-center py-10 text-muted-foreground">No application history data available</p>
				)}
			</div>
		</div>
	);
}