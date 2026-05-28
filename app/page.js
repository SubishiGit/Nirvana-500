import fs from 'fs/promises';
import path from 'path';
import MasterPlan from "../components/MasterPlan";
import OrientationLock from "../components/OrientationLock";
import { loadSheetPlotsData } from "@/lib/loadSheetPlots";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSheetData() {
  try {
    const result = await loadSheetPlotsData();
    if (!result.ok) {
      console.warn(`Sheet load failed: ${result.error}`);
    }
    const rows = result.rows || [];
    const caps =
      Array.isArray(result.caps) && result.caps.length === 8
        ? result.caps.map((n) => (Number.isFinite(Number(n)) ? Math.round(Number(n)) : 0))
        : [0, 0, 0, 0, 0, 0, 0, 0];
    return { rows, caps };
  } catch (err) {
    console.warn("Sheet load error. Continuing without sheet data.", err);
    return { rows: [], caps: [0, 0, 0, 0, 0, 0, 0, 0] };
  }
}

async function getMapData() {
  const filePath = path.join(process.cwd(), 'public', 'plots.json');
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Could not read plots.json. Did you run `npm run svg:convert`?", error);
    return { viewBox: "0 0 1000 1000", plots: [] };
  }
}

export default async function HomePage() {
  const [sheetPayload, mapData] = await Promise.all([
    getSheetData(),
    getMapData()
  ]);

  return (
    <OrientationLock>
      <main className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden" style={{
        minHeight: '100vh',
        minHeight: '100dvh', // Dynamic viewport height for mobile
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
        <MasterPlan mapData={mapData} sheetRows={sheetPayload.rows} sheetCaps={sheetPayload.caps} />
      </main>
    </OrientationLock>
  );
}
