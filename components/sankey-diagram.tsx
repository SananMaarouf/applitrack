"use client";
import { ResponsiveSankey } from "@nivo/sankey"
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { toast } from "sonner";


export function SankeyDiagram() {
	const aggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.aggregatedStatusHistory);
	const { theme } = useTheme();
	const diagramRef = useRef<HTMLDivElement>(null);
	
	const exportDiagram = async () => {
		if (!diagramRef.current) return;
		
		try {
			const canvas = await html2canvas(diagramRef.current, {
				backgroundColor: theme === 'light' ? '#231f20' : '#ede7e0',
				scale: 2, // Higher quality
				useCORS: true,
				allowTaint: true,
				logging: false,
				onclone: (clonedDoc) => {
					// Fix oklch color issues by ensuring proper color rendering
					const clonedElement = clonedDoc.querySelector('[class*="bg-foreground"]');
					if (clonedElement instanceof HTMLElement) {
						clonedElement.style.backgroundColor = theme === 'light' ? '#231f20' : '#ede7e0';
					}
				}
			});
			
			// Convert canvas to blob and download
			canvas.toBlob((blob) => {
				if (!blob) return;
				
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				const timestamp = new Date().toISOString().split('T')[0];
				link.download = `sankey-diagram-${timestamp}.png`;
				link.href = url;
				link.click();
				URL.revokeObjectURL(url);
				
				toast.success("Diagram exported successfully!");
			});
		} catch (error) {
			console.error("Error exporting diagram:", error);
			toast.error("Failed to export diagram");
		}
	};
	
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
	// (e.g., mobile or small tablet)
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
		<div className="w-full mx-auto">
			{links.length > 0 && (
				<div className="flex justify-end mb-2">
					<Button 
						onClick={exportDiagram}
						variant="default"
						size="sm"
						className="flex items-center gap-2"
					>
						<Download className="h-4 w-4" />
						Export
					</Button>
				</div>
			)}
			<div ref={diagramRef} className="bg-foreground text-background p-3 min-h-120 md:min-h-96 rounded-lg">
				{links.length > 0 ? (
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
						labelTextColor={theme === 'light' ? '#ede7e0' : '#231f20' }
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
					<p className="text-center py-10 text-background">No application history data available</p>
				)}
			</div>
		</div>
	);
}