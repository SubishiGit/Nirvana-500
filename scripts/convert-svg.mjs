import fs from 'fs';
import path from 'path';

// --- Configuration ---
const INPUT_SVG_PATH = path.join(process.cwd(), 'public', 'map.svg');
const OUTPUT_JSON_PATH = path.join(process.cwd(), 'public', 'plots.json');

// --- Helper Functions ---
function getAttr(tag, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m1 = tag.match(new RegExp(`(?:\\s|<)${esc}\\s*=\\s*"([^"]*)"`));
  if (m1) return m1[1];
  const m2 = tag.match(new RegExp(`(?:\\s|<)${esc}\\s*=\\s*'([^']*)'`));
  return m2 ? m2[1] : null;
}

function rectToPoints(x, y, w, h) {
  return `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`;
}

function pathToPoints(d) {
    const tokens = (d || "").replace(/,/g, " ").trim().match(/[MmLlHhVvZz]|-?\d*\.?\d+/g);
    if (!tokens) return "";
    let i = 0, cmd = null, x = 0, y = 0, x0 = 0, y0 = 0;
    const out = [];
    const push = (nx, ny) => { x = nx; y = ny; out.push([x, y]); };
    const rel = (dx, dy) => push(x + dx, y + dy);
    while (i < tokens.length) {
        const t = tokens[i++];
        if (/[MmLlHhVvZz]/.test(t)) {
            cmd = t;
            if (t.toUpperCase() === "Z") { push(x0, y0); }
            continue;
        }
        switch (cmd) {
            case "M": { const nx = +t, ny = +tokens[i++]; push(nx, ny); x0 = x; y0 = y; cmd = "L"; break; }
            case "m": { const dx = +t, dy = +tokens[i++]; rel(dx, dy); x0 = x; y0 = y; cmd = "l"; break; }
            case "L": { const nx = +t, ny = +tokens[i++]; push(nx, ny); break; }
            case "l": { const dx = +t, dy = +tokens[i++]; rel(dx, dy); break; }
            case "H": { const nx = +t; push(nx, y); break; }
            case "h": { const dx = +t; push(x + dx, y); break; }
            case "V": { const ny = +t; push(x, ny); break; }
            case "v": { const dy = +t; push(x, y + dy); break; }
        }
    }
    if (out.length < 3) return "";
    return out.map(([px, py]) => `${(+px).toFixed(2)},${(+py).toFixed(2)}`).join(" ");
}

function normalizePlotId(id) {
  const s = String(id || "").trim();
  // Common export pattern: ids like "_90" or "_90_" should become "90"
  // so they can match sheet column values exactly.
  return s.replace(/^_+/, "").replace(/_+$/, "");
}

function main() {
  console.log(`Reading SVG from: ${INPUT_SVG_PATH}`);
  const svg = fs.readFileSync(INPUT_SVG_PATH, "utf8");

  const viewBox = getAttr(svg, "viewBox") || "0 0 1000 1000";
  const plots = [];
  let autoId = 1;

  const shapeTags = svg.match(/<\s*(rect|path|polygon)\b[^>]*>/gi) || [];

  for (const tag of shapeTags) {
    let id = getAttr(tag, "id");
    let points = "";

    if (tag.startsWith("<rect")) {
      if (!id) id = `Rect-${autoId++}`;
      const x = parseFloat(getAttr(tag, "x") || "0");
      const y = parseFloat(getAttr(tag, "y") || "0");
      const w = parseFloat(getAttr(tag, "width") || "NaN");
      const h = parseFloat(getAttr(tag, "height") || "NaN");
      if (isFinite(w) && isFinite(h) && w > 0 && h > 0) {
        points = rectToPoints(x, y, w, h);
      }
    } else if (tag.startsWith("<path")) {
        if (!id) id = `Path-${autoId++}`;
        const d = getAttr(tag, "d") || "";
        points = pathToPoints(d);
    } else if (tag.startsWith("<polygon")) {
        if (!id) id = `Poly-${autoId++}`;
        points = (getAttr(tag, "points") || "").trim().replace(/\s+/g, " ");
    }
    
    if (id && points) {
      plots.push({ id: normalizePlotId(id), points });
    }
  }

  const output = { viewBox, plots };
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2));
  
  console.log(`Success! Wrote ${OUTPUT_JSON_PATH}`);
  console.log(`  - ViewBox: ${viewBox}`);
  console.log(`  - Plots converted: ${plots.length} / ${shapeTags.length} shapes found`);
}

main();
