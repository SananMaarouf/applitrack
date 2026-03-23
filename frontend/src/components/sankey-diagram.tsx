"use client";

import { ResponsiveSankey } from "@nivo/sankey";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { useTheme } from "next-themes";
import html2canvas from "html2canvas-pro";
import { toast } from "sonner";

export interface SankeyDiagramHandle {
  exportCSV: () => void;
  exportDiagram: () => void;
}

export const SankeyDiagram = forwardRef<SankeyDiagramHandle>(function SankeyDiagram(_, ref) {
  const aggregatedStatusHistory = useAggregatedStatusHistoryStore(
    (state) => state.aggregatedStatusHistory,
  );
  const { theme } = useTheme();
  const diagramRef = useRef<HTMLDivElement>(null);

  const statusOrder: Record<string, number> = {
    Applied: 1,
    Interview: 2,
    "Second Interview": 3,
    "Third Interview": 4,
    Offer: 5,
    Rejected: 6,
    Ghosted: 7,
  };

  // Nivo Sankey requires an acyclic graph, so keep only forward transitions.
  const sankeyFlow = aggregatedStatusHistory
    .map((item) => ({
      from: String(item.From),
      to: String(item.To),
      weight: Number(item.Weight),
    }))
    .filter((item) => {
      if (!Number.isFinite(item.weight) || item.weight <= 0) return false;
      if (item.from === item.to) return false;

      const fromOrder = statusOrder[item.from];
      const toOrder = statusOrder[item.to];
      if (!fromOrder || !toOrder) return false;

      return fromOrder < toOrder;
    });

  const exportCSV = () => {
    const headers = ["From", "To", "Weight"];
    const rows = aggregatedStatusHistory.map((item) => [
      String(item.From),
      String(item.To),
      String(item.Weight),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split("T")[0];
    link.download = `sankey-data-${timestamp}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully!");
  };

  const exportDiagram = async () => {
    if (!diagramRef.current) return;

    try {
      const canvas = await html2canvas(diagramRef.current, {
        backgroundColor: theme === "light" ? "#231f20" : "#ede7e0",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(
            '[class*="bg-foreground"]',
          );
          if (clonedElement instanceof HTMLElement) {
            clonedElement.style.backgroundColor =
              theme === "light" ? "#231f20" : "#ede7e0";
          }
        },
      });

      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().split("T")[0];
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

  const rawNodes = sankeyFlow.map((item) => ({
    source: item.from,
    target: item.to,
  }));

  const allNodeIds = rawNodes.reduce((acc, curr) => {
    acc.push(curr.source);
    acc.push(curr.target);
    return acc;
  }, [] as string[]);

  const uniqueNodeIds = Array.from(new Set(allNodeIds));

  const nodes = uniqueNodeIds.map((id) => {
    let nodeColor = "";
    switch (id) {
      case "Applied":
        nodeColor = "hsl(224, 100%, 58%)";
        break;
      case "Interview":
        nodeColor = "hsl(33, 100%, 50%)";
        break;
      case "Second Interview":
        nodeColor = "hsl(191, 100%, 52%)";
        break;
      case "Third Interview":
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

  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      setIsNarrow(window.innerWidth < 768);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  const links = sankeyFlow.map((item) => ({
    source: item.from,
    target: item.to,
    value: item.weight,
  }));

  const sankeyData = { nodes, links };

  useImperativeHandle(ref, () => ({ exportCSV, exportDiagram }));

  return (
    <div className="w-full mx-auto">
      <div className="bg-foreground rounded-xl overflow-hidden">
        <div
          ref={diagramRef}
          className="bg-foreground text-background min-h-96 md:min-h-0 md:h-72 rounded-lg"
        >
          {links.length > 0 ? (
            <ResponsiveSankey
              data={sankeyData}
              margin={
                isNarrow
                  ? { top: 15, right: 20, bottom: 20, left: 10 }
                  : { top: 10, right: 84, bottom: 10, left: 70 }
              }
              align="justify"
              colors={{ datum: "nodeColor" }}
              nodeThickness={18}
              nodeSpacing={24}
              linkOpacity={1}
              nodeBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
              enableLinkGradient={true}
              linkBlendMode="normal"
              labelPosition="outside"
              labelOrientation="horizontal"
              labelPadding={10}
              labelTextColor={theme === "light" ? "#ede7e0" : "#231f20"}
              layout={isNarrow ? "vertical" : "horizontal"}
              theme={{
                labels: {
                  text: {
                    fontSize: "0.7rem",
                    fontWeight: "bolder",
                  },
                },
                tooltip: {
                  container: {
                    background: "#333",
                    color: "#fff",
                    fontSize: "12px",
                    padding: "5px",
                    borderRadius: "4px",
                  },
                },
              }}
            />
          ) : (
            <p className="text-center py-10 text-background">
              No application history data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
