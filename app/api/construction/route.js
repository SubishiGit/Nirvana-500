import { google } from "googleapis";
import { NextResponse } from "next/server";

// Construction stage weightages (must add up to 100%)
const STAGE_WEIGHTS = {
  "01 Ground Levelling": 5,
  "02 Foundation": 10,
  "03 Plinth Beams": 5,
  "04 First Slab": 6,
  "05 Second Slab": 5,
  "06 Third Slab": 4,
  "07 GF Brick Work": 6,
  "08 FF Brick Work": 6,
  "09 TF Brick Work": 5,
  "10 Plumbing & Electrical": 8,
  "11 Internal Plastering": 7,
  "12 External Plastering": 6,
  "13 Elevations": 6,
  "14 Flooring": 10,
  "15 Painting": 7,
  "16 Completion": 4
};

const STAGE_ORDER = Object.keys(STAGE_WEIGHTS);

function calculateVillaProgress(stageStatuses) {
  let totalProgress = 0;
  let displayStage = null;
  let stageStatus = "not_started"; // "not_started", "in_progress", "completed"
  let lastCompletedStage = null;

  STAGE_ORDER.forEach((stageName, index) => {
    const status = stageStatuses[index];
    const weight = STAGE_WEIGHTS[stageName];

    if (status === 2) {
      // Stage completed
      totalProgress += weight;
      lastCompletedStage = stageName;
    } else if (status === 1) {
      // Stage in progress
      totalProgress += weight * 0.5;
      if (!displayStage) {
        displayStage = stageName;
        stageStatus = "in_progress";
      }
    }
  });

  // If no stage is in progress, show the last completed stage
  if (stageStatus !== "in_progress" && lastCompletedStage) {
    displayStage = lastCompletedStage;
    stageStatus = "completed";
  }

  // If nothing started at all
  if (!displayStage && totalProgress === 0) {
    displayStage = null;
    stageStatus = "not_started";
  }

  return {
    completionPercentage: Math.round(totalProgress),
    currentStage: displayStage,
    stageStatus: stageStatus,
    currentStageIndex: displayStage ? STAGE_ORDER.indexOf(displayStage) : -1
  };
}

export async function GET(req) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const constructionSheetId = process.env.CONSTRUCTION_SHEET_ID;
    const constructionRange = process.env.CONSTRUCTION_RANGE || "Sheet3!B2:R287";

    if (!apiKey || !constructionSheetId) {
      return NextResponse.json({ 
        error: "Missing GOOGLE_API_KEY or CONSTRUCTION_SHEET_ID",
        success: false
      }, { status: 500 });
    }

    const sheets = google.sheets({ version: "v4" });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: constructionSheetId,
      range: constructionRange,
      key: apiKey,
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return NextResponse.json({ 
        success: true,
        data: {},
        totalVillas: 0,
        message: "No construction data found"
      });
    }

    // First row is headers (Villa, stage names)
    // Process data rows (row 2 onwards in sheet, row 1+ in array since we start from B2)
    const constructionData = {};
    
    // Skip first row (headers) - start from index 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const villaNumber = String(row[0] || "").trim();
      
      if (!villaNumber) continue;

      // Get stage statuses (columns C to R, which is index 1-16 in the row)
      const stageStatuses = row.slice(1).map(val => {
        const num = parseInt(val);
        return [0, 1, 2].includes(num) ? num : 0;
      });

      const progress = calculateVillaProgress(stageStatuses);
      constructionData[villaNumber] = progress;
    }

    return NextResponse.json({ 
      success: true,
      data: constructionData,
      totalVillas: Object.keys(constructionData).length,
      stageNames: STAGE_ORDER
    });

  } catch (e) {
    console.error("Construction API Error:", e);
    const errorMessage = e.response?.data?.error?.message || e.message;
    return NextResponse.json({ 
      error: errorMessage,
      success: false
    }, { status: 500 });
  }
}
