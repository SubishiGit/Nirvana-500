"use client";

import React, { useMemo } from 'react';

function safeClipId(plotId) {
  return String(plotId).replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Bbox center + font size so label fits inside polygon (clipping handles overflow). */
function getLabelLayout(pointsStr, label) {
  // Accept both SVG point formats: "x,y x,y" and "x y x y" (and mixed/with extra spaces).
  const nums = String(pointsStr || "")
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(parseFloat);
  const xs = [];
  const ys = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    if (Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x);
      ys.push(y);
    }
  }
  if (!xs.length) return null;
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  const short = Math.min(w, h);
  const len = Math.max(String(label).length, 1);
  // Large text, scaled down by width and digit count; clipPath keeps it inside polygon.
  // Multiplier shrinks the final size so labels read naturally on the tilted map.
  const SIZE_SCALE = 0.92;
  const byShort = short * 0.62;
  const byWidth = (w * 1.05) / (len * 0.58);
  const fontSize = Math.max(6, Math.min(byShort, byWidth, short * 0.9)) * SIZE_SCALE;
  return { cx, cy, fontSize };
}

export function VirtualizedPlots({ 
  plots, 
  viewBox, 
  currentZoom, 
  onPlotHover, 
  onPlotLeave,
  onPlotClick,
  activePlotId,
  matchedPlotIds, // optional Set<string> of plot ids matching filters
  hasActiveFilters = false
}) {
  // Determine which plots to highlight based on filters and hover state
  const highlightedIds = useMemo(() => {
    const highlighted = new Set();
    
    // Highlight filter matches when active
    if (hasActiveFilters && matchedPlotIds && matchedPlotIds.size > 0) {
      matchedPlotIds.forEach(id => highlighted.add(id));
    }
    
    // Always highlight the actively hovered/active plot
    if (activePlotId) {
      const activePlot = plots.find(p => p.id === activePlotId);
      if (activePlot) {
        highlighted.add(activePlotId);
        // If it's a canal, highlight all canal plots
        if (activePlot.plotType === 'canal') {
          plots.filter(p => p.plotType === 'canal').forEach(p => highlighted.add(p.id));
        }
      }
    }
    
    return highlighted;
  }, [activePlotId, plots, hasActiveFilters, matchedPlotIds]);

  const clipTargets = useMemo(
    () => plots.filter((p) => highlightedIds.has(p.id)),
    [plots, highlightedIds]
  );

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%' 
      }}
      onMouseLeave={onPlotLeave}
    >
      <defs>
        {clipTargets.map((plot) => (
          <clipPath key={`clip-${plot.id}`} id={`plot-clip-${safeClipId(plot.id)}`}>
            <polygon points={plot.points} />
          </clipPath>
        ))}
      </defs>
      <g>
        {plots.map((plot) => {
          const isHighlighted = highlightedIds.has(plot.id);
          const isHovered = activePlotId === plot.id;

          // Plots are transparent by default. Color only appears when the
          // plot is hovered, or when it matches an active filter.
          let fill = 'transparent';
          let opacity = 1;
          let stroke = 'rgba(255, 255, 255, 0.2)';
          let strokeWidth = 1;

          if (isHighlighted) {
            fill = plot.color;
            stroke = 'white';
            strokeWidth = 0.6;
          }

          if (isHovered) {
            fill = plot.color;
            opacity = 1;
            stroke = 'white';
            strokeWidth = 0.6;
          }

          const label = String(plot.id);
          const layout = isHighlighted ? getLabelLayout(plot.points, label) : null;
          const clipRef = `url(#plot-clip-${safeClipId(plot.id)})`;
          const labelFill =
            plot.sheetData?.availability === "Blocked" ? "#000000" : "#ffffff";
          
          return (
            <g key={plot.id}>
              <polygon
                points={plot.points}
                style={{
                  fill: fill,
                  stroke: stroke,
                  strokeWidth: strokeWidth,
                  opacity: opacity,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                }}
                onMouseEnter={() => onPlotHover(plot)}
                onMouseLeave={onPlotLeave}
                onClick={(e) => onPlotClick && onPlotClick(plot, e)}
              />
              {isHighlighted && layout && (
                <text
                  x={layout.cx}
                  y={layout.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={labelFill}
                  fontWeight={700}
                  fontSize={layout.fontSize}
                  fontFamily="var(--font-twk-issey), system-ui, sans-serif"
                  clipPath={clipRef}
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
