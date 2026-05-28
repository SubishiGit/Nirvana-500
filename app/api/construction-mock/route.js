import { NextResponse } from "next/server";

// Mock construction data for testing the tooltip display
// This simulates what the real API would return once spreadsheet access is fixed

const STAGE_ORDER = [
  "01 Ground Levelling",
  "02 Foundation",
  "03 Plinth Beams",
  "04 First Slab",
  "05 Second Slab",
  "06 Third Slab",
  "07 GF Brick Work",
  "08 FF Brick Work",
  "09 TF Brick Work",
  "10 Plumbing & Electrical",
  "11 Internal Plastering",
  "12 External Plastering",
  "13 Elevations",
  "14 Flooring",
  "15 Painting",
  "16 Completion"
];

// Generate mock data for testing
function generateMockConstructionData() {
  const mockData = {};
  
  // Create varied construction progress for first 50 villas
  for (let i = 1; i <= 50; i++) {
    const villaNumber = String(i);
    
    // Different progress levels for testing
    let completionPercentage, currentStage;
    
    if (i <= 10) {
      // Early stage (0-30%)
      completionPercentage = Math.floor(Math.random() * 30);
      currentStage = STAGE_ORDER[Math.floor(Math.random() * 5)];
    } else if (i <= 25) {
      // Mid stage (30-60%)
      completionPercentage = 30 + Math.floor(Math.random() * 30);
      currentStage = STAGE_ORDER[5 + Math.floor(Math.random() * 5)];
    } else if (i <= 40) {
      // Advanced stage (60-90%)
      completionPercentage = 60 + Math.floor(Math.random() * 30);
      currentStage = STAGE_ORDER[10 + Math.floor(Math.random() * 4)];
    } else {
      // Near completion or complete (90-100%)
      completionPercentage = 90 + Math.floor(Math.random() * 11);
      currentStage = STAGE_ORDER[14 + Math.floor(Math.random() * 2)];
    }
    
    mockData[villaNumber] = {
      completionPercentage,
      currentStage,
      currentStageIndex: STAGE_ORDER.indexOf(currentStage)
    };
  }
  
  return mockData;
}

export async function GET(req) {
  console.log("⚠️  Using MOCK construction data for testing!");
  
  const mockData = generateMockConstructionData();
  
  return NextResponse.json({ 
    success: true,
    data: mockData,
    totalVillas: Object.keys(mockData).length,
    stageNames: STAGE_ORDER,
    isMockData: true
  });
}

