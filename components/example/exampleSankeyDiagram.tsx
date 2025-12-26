"use client";
import { ResponsiveSankey } from "@nivo/sankey"
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// Mock data
const mockJobApplications = [
	{
		"id": 7,
		"user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
		"created_at": "2025-08-06T23:47:13.981503+00:00",
		"applied_at": "2025-08-07",
		"expires_at": null,
		"position": "Software Engineer",
		"company": "Startup Inc.",
		"status": 6,
		"link": ""
	},
	{
		"id": 6,
		"user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
		"created_at": "2025-08-06T23:44:07.972831+00:00",
		"applied_at": "2025-03-07",
		"expires_at": null,
		"position": "Web developer",
		"company": "Big Tech Co",
		"status": 7,
		"link": ""
	},
	{
		"id": 5,
		"user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
		"created_at": "2025-08-06T23:05:50.116898+00:00",
		"applied_at": "2025-08-07",
		"expires_at": null,
		"position": "Data analyst",
		"company": "Evil corp",
		"status": 6,
		"link": ""
	},
	{
		"id": 4,
		"user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
		"created_at": "2025-08-06T22:57:54.05042+00:00",
		"applied_at": "2025-08-06",
		"expires_at": null,
		"position": "Janitor",
		"company": "Local school",
		"status": 5,
		"link": ""
	}
];

// Status mapping
const statusMap: { [key: number]: string } = {
	1: "Applied",
	2: "Interview",
	3: "2nd Interview",
	4: "3rd Interview",
	5: "Offer",
	6: "Rejected",
	7: "Ghosted"
};

export function ExampleSankeyDiagram() {
	const { theme } = useTheme();

	// Transform job applications into aggregated status history
	const aggregatedStatusHistory = mockJobApplications.map(app => ({
		From: "Applied",
		To: statusMap[app.status] || "Unknown",
		Weight: 1
	}));

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
				nodeColor = "hsl(83, 90%, 40%)";
				break;
			case "Rejected":
				nodeColor = "hsl(339, 100%, 50%)";
				break;
			case "Ghosted":
				nodeColor = "hsl(195, 9%, 64%)";
				break;
			default:
				nodeColor = "hsl(0, 0%, 70%)";
				break;
		}
		return { id, nodeColor };
	});

	// Determine if the viewport is narrow
	const [isNarrow, setIsNarrow] = useState(false);

	useEffect(() => {
		const updatePosition = () => {
			setIsNarrow(window.innerWidth < 768);
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
		<div className="w-full mx-auto h-fit">
			<div className="bg-background text-card-foreground p-3 min-h-64 md:min-h-96 rounded-lg transition-all duration-300">
				{links.length > 1 ? (
					<ResponsiveSankey
						data={sankeyData}
						margin={isNarrow
							? { top: 20, right: 30, bottom: 20, left: 10 }
							: { top: 42, right: 84, bottom: 42, left: 70 }}
						align="justify"
						colors={{ datum: 'nodeColor' }}
						nodeThickness={18}
						nodeSpacing={24}
						linkOpacity={1}
						nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
						enableLinkGradient={true}
						linkBlendMode="normal"
						labelPosition='outside'
						labelOrientation="horizontal"
						labelPadding={10}
						labelTextColor={theme === 'light' ? '#231f20': '#ede7e0'}
						layout={isNarrow ? 'vertical' : 'horizontal'}
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
					<p className="text-center py-10 text-foreground">No application history data available</p>
				)}
			</div>
		</div>
	);
}