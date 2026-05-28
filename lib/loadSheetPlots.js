import { google } from "googleapis";

const EMPTY_CAPS = [0, 0, 0, 0, 0, 0, 0, 0];

function normalizeAvailability(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "2") return "Sold";
  if (s === "1") return "Blocked";
  if (s === "0") return "Available";
  return "Available";
}

function normalizeHeaderKey(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildHeaderIndex(headerRow) {
  const idx = new Map();
  (headerRow || []).forEach((h, i) => {
    const key = normalizeHeaderKey(h);
    if (!key) return;
    if (!idx.has(key)) idx.set(key, i);
  });
  return idx;
}

function findHeaderIndex(headerIndex, patterns) {
  for (const [key, i] of headerIndex.entries()) {
    if (patterns.some((re) => re.test(key))) return i;
  }
  return -1;
}

function sheetPrefixFromRange(range) {
  const r = String(range || "").trim();
  const bang = r.lastIndexOf("!");
  if (bang <= 0) return null;
  let name = r.slice(0, bang).trim();
  if ((name.startsWith("'") && name.endsWith("'")) || (name.startsWith('"') && name.endsWith('"'))) {
    name = name.slice(1, -1);
  }
  return name || null;
}

function sheetRangeA1(sheetName, cellRange) {
  if (!sheetName) return cellRange;
  const n = String(sheetName);
  const quoted = /[^A-Za-z0-9_]/.test(n) ? `'${n.replace(/'/g, "''")}'` : n;
  return `${quoted}!${cellRange}`;
}

function normalizeCapsFromGrid(values) {
  const out = Array(8).fill(0);
  const rows = values || [];
  for (let i = 0; i < 8; i++) {
    const cell = rows[i]?.[0];
    const n = parseFloat(String(cell ?? "").replace(/,/g, "").trim());
    out[i] = Number.isFinite(n) ? Math.round(n) : 0;
  }
  return out;
}

function extractCapsFromBatch(valueRanges, capsRangeLabel) {
  const label = String(capsRangeLabel || "").replace(/^'+|'+$/g, "");
  const labelCell = label.split("!").pop();
  for (const vr of valueRanges || []) {
    const rr = String(vr.range || "").replace(/^'+|'+$/g, "");
    if (labelCell && rr.endsWith(labelCell)) {
      return normalizeCapsFromGrid(vr.values);
    }
  }
  const last = valueRanges?.[valueRanges.length - 1]?.values;
  return normalizeCapsFromGrid(last);
}

/**
 * Load villa rows + CAPS from Google Sheets (same logic as /api/plots).
 * Use this from Server Components instead of fetch("/api/plots") so production
 * does not depend on HTTP self-calls (Vercel Deployment Protection, VERCEL_URL, etc.).
 */
export async function loadSheetPlotsData() {
  const apiKey = process.env.GOOGLE_API_KEY;
  const sheetId = process.env.SHEET_ID;
  const sheetRangeRaw = process.env.SHEET_RANGE;

  if (!apiKey || !sheetId) {
    return {
      ok: false,
      error: "Missing GOOGLE_API_KEY or SHEET_ID",
      rows: [],
      caps: [...EMPTY_CAPS],
    };
  }
  if (!sheetRangeRaw) {
    return {
      ok: false,
      error: "Missing SHEET_RANGE",
      rows: [],
      caps: [...EMPTY_CAPS],
    };
  }

  try {
    const sheets = google.sheets({ version: "v4" });

    const userRanges = sheetRangeRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const sheetPrefix = sheetPrefixFromRange(userRanges[0] || "");
    const capsRange =
      process.env.SHEET_CAPS_RANGE?.trim() ||
      (sheetPrefix ? sheetRangeA1(sheetPrefix, "H9:H16") : "Sheet1!H9:H16");
    const capsNorm = capsRange.replace(/\s/g, "");
    const ranges = userRanges.some((r) => r.replace(/\s/g, "") === capsNorm)
      ? userRanges
      : [...userRanges, capsRange];

    const batch = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: ranges,
      key: apiKey,
    });

    const vals = batch.data.valueRanges || [];
    const caps = extractCapsFromBatch(vals, capsRange);
    const table = vals[0]?.values || [];

    let constructionData = {};
    try {
      const constructionSheetId = process.env.CONSTRUCTION_SHEET_ID || sheetId;
      const constructionRange = process.env.CONSTRUCTION_RANGE || "Sheet3!B2:R287";

      const constructionResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: constructionSheetId,
        range: constructionRange,
        key: apiKey,
      });

      const constructionRows = constructionResponse.data.values || [];

      if (constructionRows.length > 1) {
        const stageWeights = [3, 9, 5, 6, 6, 5, 4, 6, 6, 5, 8, 7, 6, 4, 9, 7, 4];
        const stageNames = [
          "Ground Levelling",
          "Foundation",
          "Plinth Beams",
          "Grade Slab",
          "First Slab",
          "Second Slab",
          "Third Slab",
          "GF Brick Work",
          "FF Brick Work",
          "TF Brick Work",
          "Plumbing & Electrical",
          "Internal Plastering",
          "External Plastering",
          "Elevations",
          "Flooring",
          "Painting",
          "Completion",
        ];

        for (let i = 1; i < constructionRows.length; i++) {
          const row = constructionRows[i] || [];
          const villaNumber = String(row[0] || "").trim();

          if (!villaNumber) continue;

          const stageStatuses = row.slice(1).map((val) => {
            const num = parseInt(val, 10);
            return [0, 1, 2].includes(num) ? num : 0;
          });

          let totalProgress = 0;
          let displayStage = null;
          let stageStatus = "not_started";
          let lastCompletedStage = null;

          stageStatuses.forEach((status, idx) => {
            const weight = stageWeights[idx] || 6.25;
            const stageName = stageNames[idx] || `Stage ${idx + 1}`;

            if (status === 2) {
              totalProgress += weight;
              lastCompletedStage = stageName;
            } else if (status === 1) {
              totalProgress += weight * 0.5;
              if (!displayStage) {
                displayStage = stageName;
                stageStatus = "in_progress";
              }
            }
          });

          if (stageStatus !== "in_progress" && lastCompletedStage) {
            displayStage = lastCompletedStage;
            stageStatus = totalProgress >= 100 ? "completed" : "completed";
          }

          if (!displayStage && totalProgress === 0) {
            displayStage = null;
            stageStatus = "not_started";
          }

          constructionData[villaNumber] = {
            completionPercentage: Math.round(totalProgress),
            currentStage: displayStage,
            stageStatus,
            currentStageIndex: displayStage ? stageNames.indexOf(displayStage) : -1,
          };
        }
      }
    } catch (err) {
      console.warn("Could not fetch construction data:", err.message);
    }

    if (table.length === 0) {
      return { ok: true, rows: [], caps };
    }

    const headerRow = table[0] || [];
    const headerIndex = buildHeaderIndex(headerRow);
    const facingIdx = findHeaderIndex(headerIndex, [/^facing\b/, /\bfacing\b/]);
    const sqftIdx = findHeaderIndex(headerIndex, [/^sqft\b/, /\bsq\s*\.?\s*ft\b/, /\bsquare\s*feet\b/]);
    const plotSizeIdx = findHeaderIndex(headerIndex, [/\bplot\b/, /\bsqyd\b/, /\bsq\s*yds?\b/, /\byards?\b/]);

    const rows = [];
    for (let i = 1; i < table.length; i++) {
      const row = table[i] || [];
      const status = row[0];
      const polygonIdRaw = row[1];
      const polygonId = String(polygonIdRaw || "").trim();
      if (!polygonId) continue;

      const availability = normalizeAvailability(status);

      const baseFacing = String(row[2] || "").trim();
      const typeLabel = String(row[3] || "").trim();

      const facing = baseFacing || (facingIdx >= 0 ? String(row[facingIdx] || "").trim() : "");
      const sqft = sqftIdx >= 0 ? String(row[sqftIdx] || "").trim() : "";
      const plotSize = plotSizeIdx >= 0 ? String(row[plotSizeIdx] || "").trim() : "";
      const type = typeLabel;

      const villaNumberMatch = polygonId.match(/\d+/);
      const villaNumber = villaNumberMatch ? villaNumberMatch[0] : null;
      const construction = villaNumber && constructionData[villaNumber] ? constructionData[villaNumber] : null;

      rows.push({
        id: polygonId,
        availability,
        facing,
        type,
        sqft,
        plotSize,
        construction,
        raw: row,
      });
    }

    return { ok: true, rows, caps };
  } catch (e) {
    console.error(e);
    const errorMessage = e.response?.data?.error?.message || e.message;
    return {
      ok: false,
      error: errorMessage,
      rows: [],
      caps: [...EMPTY_CAPS],
    };
  }
}
