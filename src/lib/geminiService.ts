import { AiAnalysisResult } from "./camsTypes";

export function generateSimulatedAnalysis(cameraName?: string) {
  const name = cameraName || "Surveillance Node";
  const flows: ("LOW" | "MODERATE" | "HIGH" | "STAMPEDE")[] = ["LOW", "MODERATE", "HIGH", "STAMPEDE"];
  
  // Deterministic or semi-random flow based on time or name
  const hour = new Date().getHours();
  let flow: "LOW" | "MODERATE" | "HIGH" | "STAMPEDE" = "MODERATE";
  if (hour >= 7 && hour <= 9) flow = "HIGH";
  else if (hour >= 16 && hour <= 18) flow = "HIGH";
  else if (hour >= 23 || hour <= 5) flow = "LOW";
  
  // Random variation
  if (Math.random() > 0.8) {
    flow = flows[Math.floor(Math.random() * flows.length)];
  }

  const summaries: Record<string, string[]> = {
    LOW: [
      `Clear conditions observed on ${name} feed. Free flow traffic.`,
      `Optimal flow at ${name}. Multi-lane traversal without delay.`,
      `Minimal vehicles detected at ${name}. Normal operations.`
    ],
    MODERATE: [
      `Moderate density at ${name}. Fluid speed limits maintained.`,
      `Steady flow along ${name}. Regular daytime volume.`,
      `Normal commute patterns observed on ${name}.`
    ],
    HIGH: [
      `Traffic volume elevated near ${name}. Intermittent slowdowns reported.`,
      `Heavy commuter volume on ${name}. Average velocity restricted.`,
      `Commuter bottleneck observed at ${name}. Expect minor delays.`
    ],
    STAMPEDE: [
      `Critical backup detected at ${name}. Stop-and-go conditions.`,
      `Severe slowdown on ${name}. Major delay on primary lanes.`,
      `Extreme density at ${name}. Vehicles static or crawling.`
    ]
  };

  const selectedSummaries = summaries[flow];
  const summary = selectedSummaries[Math.floor(Math.random() * selectedSummaries.length)];

  // Generate 2-6 simulated detections
  const numDetections = Math.floor(Math.random() * 5) + 2;
  const labels = ["car", "truck", "suv", "motorcycle", "bus"];
  const detections = [];

  for (let i = 0; i < numDetections; i++) {
    const label = labels[Math.floor(Math.random() * labels.length)];
    const confidence = parseFloat((0.75 + Math.random() * 0.23).toFixed(2));
    
    // Bounding box in [ymin, xmin, ymax, xmax] format (normalized 0-1000)
    const ymin = Math.floor(200 + Math.random() * 400);
    const xmin = Math.floor(100 + Math.random() * 700);
    const ymax = Math.min(1000, ymin + Math.floor(100 + Math.random() * 200));
    const xmax = Math.min(1000, xmin + Math.floor(100 + Math.random() * 200));

    detections.push({
      label,
      confidence,
      box_2d: [ymin, xmin, ymax, xmax]
    });
  }

  return {
    detections,
    summary,
    flow
  };
}

export async function analyzeFrame(
  base64Image: string,
  cameraName?: string,
): Promise<AiAnalysisResult> {
  try {
    const analysis = generateSimulatedAnalysis(cameraName);
    return {
      ...analysis,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      detections: [],
      summary: "AI ANALYSIS ERROR",
      flow: "LOW",
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}

