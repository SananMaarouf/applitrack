"use client";
import { Chart } from "react-google-charts";
import { useEffect, useState } from "react";
import { JobApplicationStatusHistory } from "@/types/jobApplication";
import { useStatusHistoryStore } from "@/store/jobsStatusHistoryStore";

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

// Map status codes to readable names
const statusNames = {
  [JobStatus.APPLIED]: "Applied",
  [JobStatus.INTERVIEW]: "First Interview",
  [JobStatus.SECOND_INTERVIEW]: "Second Interview", 
  [JobStatus.THIRD_INTERVIEW]: "Third Interview",
  [JobStatus.OFFER]: "Offer",
  [JobStatus.REJECTED]: "Rejected",
  [JobStatus.GHOSTED]: "Ghosted"
};

export const options = {
  sankey: {
    node: {
      colors: ["#36a2eb", "#ff6384", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#4caf50"],
      label: { 
        fontSize: 14,
        bold: true
      }
    },
    link: {
      colorMode: "target",
      colors: ["#36a2eb", "#ff6384", "#ffce56", "#4bc0c0", "#9966ff", "#ff9f40", "#4caf50"],
    },
  },
};

export function SankeyDiagram() {
  const jobApplicationStatusHistory: JobApplicationStatusHistory[] = useStatusHistoryStore((state) => state.jobApplicationStatusHistory );
  const [chartData, setChartData] = useState([["From", "To", "Weight"]]);

  console.log("jobApplicationStatusHistory", jobApplicationStatusHistory);
  useEffect(() => {
    if (!jobApplicationStatusHistory || jobApplicationStatusHistory.length === 0) return;
    
    
    // Group status entries by application ID to track status transitions
    const applicationStatusMap = new Map();
    
    // Sort entries by date to ensure correct sequence
    const sortedEntries = [...jobApplicationStatusHistory].sort((a, b) => 
      new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );
    
    // Create a map of application IDs to their status history
    sortedEntries.forEach(entry => {
      if (!applicationStatusMap.has(entry.application_id)) {
        applicationStatusMap.set(entry.application_id, []);
      }
      applicationStatusMap.get(entry.application_id).push({
        status: entry.status,
        changed_at: entry.changed_at
      });
    });
    
    // Count transitions between statuses
    const transitions: Record<string, number> = {};
    
    // Create separate aggregations for "normal flow" and "corrections"
    const normalTransitions: Record<string, number> = {};
    const correctionTransitions: Record<string, number> = {};
    
    // Define expected progression path
    const expectedProgressionOrder = [
      JobStatus.APPLIED,
      JobStatus.INTERVIEW,
      JobStatus.SECOND_INTERVIEW,
      JobStatus.THIRD_INTERVIEW,
      JobStatus.OFFER
    ];
    
    // Process each application's status history
    applicationStatusMap.forEach(statusHistory => {
      // Skip applications with only one status entry (no transitions)
      if (statusHistory.length <= 1) return;
      
      // Analyze transitions
      for (let i = 0; i < statusHistory.length - 1; i++) {
        const fromStatus = statusHistory[i].status;
        const toStatus = statusHistory[i + 1].status;
        
        const transitionKey = `${fromStatus}-${toStatus}`;
        
        // Check if this is a forward progression or a correction
        const fromIndex = expectedProgressionOrder.indexOf(fromStatus);
        const toIndex = expectedProgressionOrder.indexOf(toStatus);
        
        // If both statuses are in the progression path
        if (fromIndex !== -1 && toIndex !== -1) {
          if (toIndex > fromIndex) {
            // Normal forward progression
            normalTransitions[transitionKey] = (normalTransitions[transitionKey] || 0) + 1;
          } else {
            // Backwards movement - likely a correction
            correctionTransitions[transitionKey] = (correctionTransitions[transitionKey] || 0) + 1;
          }
        } else if (
          // Transitions to terminal states (rejected/ghosted)
          (fromIndex !== -1 && (toStatus === JobStatus.REJECTED || toStatus === JobStatus.GHOSTED)) ||
          // Transitions from terminal states (corrections)
          ((fromStatus === JobStatus.REJECTED || fromStatus === JobStatus.GHOSTED) && toIndex !== -1)
        ) {
          if (fromStatus === JobStatus.REJECTED || fromStatus === JobStatus.GHOSTED) {
            // This is a correction from a terminal state
            correctionTransitions[transitionKey] = (correctionTransitions[transitionKey] || 0) + 1;
          } else {
            // Normal transition to a terminal state
            normalTransitions[transitionKey] = (normalTransitions[transitionKey] || 0) + 1;
          }
        } else {
          // Other transitions
          transitions[transitionKey] = (transitions[transitionKey] || 0) + 1;
        }
      }
    });
    
    // Merge all transitions, prioritizing normal ones
    const allTransitions = { ...transitions, ...correctionTransitions, ...normalTransitions };
    
    // Create data for the Sankey diagram
    const sankeyData = [["From", "To", "Weight"]];
    
    // Add each transition to the chart data
    Object.entries(allTransitions).forEach(([transitionKey, count]) => {
      const [fromStatus, toStatus] = transitionKey.split('-').map(Number);
      sankeyData.push([
        statusNames[fromStatus as keyof typeof statusNames] || `Status ${fromStatus}`,
        statusNames[toStatus as JobStatus] || `Status ${toStatus}`,
        count as any
      ]);
    });
    
    // Handle single-status applications
    const singleStatusApplications: Record<number, number> = {};
    applicationStatusMap.forEach(statusHistory => {
      if (statusHistory.length === 1) {
        const status = statusHistory[0].status;
        singleStatusApplications[status] = (singleStatusApplications[status] || 0) + 1;
      }
    });
    
    // Add single-status applications to chart
    Object.entries(singleStatusApplications).forEach(([status, count]) => {
      const statusNum = Number(status);
      // Always assume these came from "Applied" even if that wasn't recorded
      if (statusNum !== JobStatus.APPLIED) {
        sankeyData.push([
          statusNames[JobStatus.APPLIED],
          statusNames[statusNum as JobStatus] || `Status ${statusNum}`,
          count as any
        ]);
      }
    });
    
    setChartData(sankeyData);
    
  }, [jobApplicationStatusHistory]);

  return (
    <div className="w-full mx-auto">
      <div className="bg-card text-card-foreground p-3 rounded-lg border hover:border-gray-500 transition-all duration-300">
        <h2 className="text-lg font-medium mb-2">Job application status flow (Sankey diagram)</h2>
        {jobApplicationStatusHistory.length > 0 ? (
          <Chart
            chartType="Sankey"
            width="100%"
            height="400px"
            loader={<div>Loading Chart</div>}
            data={chartData}
            options={options}
          />
        ) : (
          <p className="text-center py-10 text-muted-foreground">No application history data available</p>
        )}
      </div>
    </div>
  );
}