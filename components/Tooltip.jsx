"use client";

import React, { useRef, useLayoutEffect, useState } from "react";
import { motion } from "framer-motion";

function titleForPlot(plot) {
  if (plot.plotType === 'clubhouse') return "Clubhouse";
  if (plot.plotType === 'canal') return "Canal / Landscaping Zone";
  const villaKey = plot.id.match(/[0-9]+[A-Z]?/)?.[0] || plot.id;
  return `Villa No. ${villaKey}`;
}

const getStatusStyle = (availability) => {
  switch (availability) {
    case "Available": return { color: "rgb(107, 225, 225)", textShadow: "0 0 8px rgba(0, 255, 255, 0.7)" };
    case "Blocked": return { color: "rgb(252, 243, 138)", textShadow: "0 0 8px rgba(255, 255, 0, 0.7)" };
    case "Sold": return { color: "rgb(248, 113, 113)", textShadow: "0 0 8px rgba(255, 0, 0, 0.7)" };
    default: return { color: "#e5e7eb" };
  }
};

// Helper to get construction status color
const getConstructionColor = (percentage) => {
  if (percentage >= 90) return "rgb(52, 211, 153)"; // Green - near complete
  if (percentage >= 60) return "rgb(251, 191, 36)"; // Amber - good progress
  if (percentage >= 30) return "rgb(96, 165, 250)"; // Blue - early stages
  if (percentage > 0) return "rgb(156, 163, 175)"; // Gray - just started
  return "rgb(107, 114, 128)"; // Dark gray - not started
};

// Simplify stage name for display
const simplifyStage = (stageName) => {
  if (!stageName) return "Not Started";
  // Remove number prefix "01 Ground Levelling" -> "Ground Levelling"
  return stageName.replace(/^\d+\s+/, "");
};

function rectOverlaps(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

export function Tooltip({
  activePlot,
  position,
  zoomLevel = 1,
  tooltipSticky = false,
  stickyPosition = null,
  onTooltipHover,
  onTooltipLeave,
  avoidRect = null,
}) {
  const tooltipRef = useRef(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [ui, setUi] = useState({ width: 280, pad: 16, title: 16, text: 14 });

  useLayoutEffect(() => {
    // responsive UI sizing
    const iw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (iw <= 360) setUi({ width: 140, pad: 6, title: 10, text: 8 });
    else if (iw <= 450) setUi({ width: 160, pad: 8, title: 11, text: 9 });
    else if (iw <= 480) setUi({ width: 260, pad: 14, title: 15, text: 13 });
    else if (iw <= 900) setUi({ width: 300, pad: 16, title: 16, text: 14 });
    else setUi({ width: 320, pad: 16, title: 16, text: 14 });

    if (activePlot && tooltipRef.current) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      
      // Use sticky position if tooltip is sticky, otherwise use mouse position
      const currentPosition = tooltipSticky && stickyPosition ? stickyPosition : position;
      
      // Adjust offset based on zoom level - closer when zoomed in, further when zoomed out
      const baseOffset = 20;
      const zoomAdjustedOffset = Math.max(15, Math.min(40, baseOffset / Math.max(0.5, zoomLevel)));
      
      let top = currentPosition.y + zoomAdjustedOffset;
      let left = currentPosition.x + zoomAdjustedOffset;
      
      // Enhanced boundary checking with margins
      const margin = 15;
      if (left + offsetWidth > innerWidth - margin) { 
        left = currentPosition.x - offsetWidth - zoomAdjustedOffset; 
      }
      if (top + offsetHeight > innerHeight - margin) { 
        top = currentPosition.y - offsetHeight - zoomAdjustedOffset; 
      }
      
      // Ensure tooltip never goes completely off-screen
      if (left < margin) left = margin;
      if (top < margin) top = margin;
      if (left + offsetWidth > innerWidth - margin) left = innerWidth - offsetWidth - margin;
      if (top + offsetHeight > innerHeight - margin) top = innerHeight - offsetHeight - margin;

      if (
        avoidRect &&
        typeof avoidRect.left === "number" &&
        typeof avoidRect.top === "number" &&
        typeof avoidRect.right === "number" &&
        typeof avoidRect.bottom === "number"
      ) {
        const gap = 12;
        const bx1 = avoidRect.left;
        const by1 = avoidRect.top;
        const bx2 = avoidRect.right;
        const by2 = avoidRect.bottom;
        let ax1 = left;
        let ay1 = top;
        let ax2 = left + offsetWidth;
        let ay2 = top + offsetHeight;
        if (rectOverlaps(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)) {
          if (bx2 + gap + offsetWidth <= innerWidth - margin) {
            left = bx2 + gap;
          } else if (by2 + gap + offsetHeight <= innerHeight - margin) {
            top = by2 + gap;
          } else if (bx1 - gap - offsetWidth >= margin) {
            left = bx1 - gap - offsetWidth;
          } else if (by1 - gap - offsetHeight >= margin) {
            top = by1 - gap - offsetHeight;
          } else {
            left = Math.min(Math.max(margin, bx2 + gap), innerWidth - offsetWidth - margin);
            top = Math.min(Math.max(margin, by2 + gap), innerHeight - offsetHeight - margin);
          }
          ax1 = left;
          ay1 = top;
          ax2 = left + offsetWidth;
          ay2 = top + offsetHeight;
          if (rectOverlaps(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)) {
            left = Math.min(bx2 + gap, innerWidth - offsetWidth - margin);
            top = Math.min(by2 + gap, innerHeight - offsetHeight - margin);
          }
          if (left < margin) left = margin;
          if (top < margin) top = margin;
          if (left + offsetWidth > innerWidth - margin) left = innerWidth - offsetWidth - margin;
          if (top + offsetHeight > innerHeight - margin) top = innerHeight - offsetHeight - margin;
        }
      }

      setTooltipStyle({ top, left });
    }
  }, [activePlot, position, zoomLevel, tooltipSticky, stickyPosition, avoidRect]);

  if (!activePlot) return null;

  const construction = activePlot.sheetData?.construction;
  const hasConstruction = construction && construction.completionPercentage !== undefined;

  return (
    <motion.div
      ref={tooltipRef}
      style={{ 
        ...tooltipStyle, 
        position: 'fixed', 
        pointerEvents: 'auto', 
        zIndex: 80,
        // Add small hover zone around tooltip
        padding: '10px',
        margin: '-10px'
      }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.8
      }}
      onMouseEnter={onTooltipHover}
      onMouseLeave={onTooltipLeave}
    >
      <div style={{ 
        padding: `${ui.pad}px`, 
        background: "rgba(15, 15, 20, 0.75)", 
        backdropFilter: "blur(20px) saturate(180%)", 
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.08)", 
        borderRadius: "14px", 
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
        color: "white", 
        fontFamily: "var(--font-twk-issey), sans-serif", 
        width: `${ui.width}px`,
        maxWidth: "90vw",
        letterSpacing: "0.02em",
        lineHeight: 1.5
      }}>
        <h3 style={{ 
          fontSize: `${ui.title}px`, 
          fontWeight: "bold", 
          borderBottom: "1px solid rgba(255,255,255,0.1)", 
          paddingBottom: `${Math.max(6, Math.round(ui.pad*0.5))}px`, 
          marginBottom: `${Math.max(3, Math.round(ui.pad*0.3))}px` 
        }}>
          {titleForPlot(activePlot)}
        </h3>
        {activePlot.plotType === "villa" && activePlot.sheetData ? (
          <div style={{ display: "flex", flexDirection: "column", gap: `${Math.max(2, Math.round(ui.pad * 0.15))}px`, fontSize: `${ui.text}px` }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Status</span> 
              <strong style={getStatusStyle(activePlot.sheetData.availability)}>
                {activePlot.sheetData.availability}
              </strong>
            </div>

            {/* CONSTRUCTION PROGRESS SECTION */}
            {hasConstruction && (
              <div style={{ 
                marginTop: `${Math.max(4, Math.round(ui.pad * 0.25))}px`,
                padding: `${Math.max(6, Math.round(ui.pad * 0.4))}px`,
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                {/* Completion Percentage */}
                {(() => {
                  // Yellow for in_progress, Green for completed
                  const percentColor = construction.stageStatus === "in_progress" 
                    ? "rgb(251, 191, 36)"  // Yellow/Amber
                    : "rgb(52, 211, 153)"; // Green
                  return (
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: `${Math.max(4, Math.round(ui.pad * 0.25))}px`
                    }}>
                      <span style={{ fontSize: `${ui.text - 1}px`, color: "#D1D5DB" }}>
                        Construction
                      </span>
                      <strong style={{ 
                        fontSize: `${ui.text + 1}px`,
                        color: percentColor,
                        textShadow: `0 0 8px ${percentColor}80`
                      }}>
                        {construction.completionPercentage}%
                      </strong>
                    </div>
                  );
                })()}

                {/* Progress Bar */}
                {(() => {
                  // Yellow for in_progress, Green for completed
                  const barColor = construction.stageStatus === "in_progress" 
                    ? "rgb(251, 191, 36)"  // Yellow/Amber
                    : "rgb(52, 211, 153)"; // Green
                  const percentage = construction.completionPercentage || 0;
                  // Ensure minimum visible width of 3% when there's any progress
                  const displayWidth = percentage > 0 ? Math.max(3, percentage) : 0;
                  return (
                    <div style={{ 
                      width: "100%", 
                      height: `${Math.max(8, Math.round(ui.pad * 0.5))}px`,
                      background: "rgba(255,255,255,0.15)", 
                      borderRadius: "4px",
                      overflow: "hidden",
                      marginBottom: `${Math.max(4, Math.round(ui.pad * 0.25))}px`
                    }}>
                      <div style={{
                        width: `${displayWidth}%`,
                        minWidth: percentage > 0 ? "8px" : "0",
                        height: "100%",
                        background: barColor,
                        borderRadius: "4px",
                        transition: "width 0.3s ease",
                        boxShadow: `0 0 8px ${barColor}80`
                      }} />
                    </div>
                  );
                })()}

                {/* Current Stage Status */}
                <div style={{ 
                  fontSize: `${ui.text - 1}px`, 
                  color: "#9CA3AF",
                  textAlign: "center"
                }}>
                  {construction.completionPercentage >= 100 ? (
                    <span style={{ color: "rgb(52, 211, 153)" }}>✓ Fully Complete</span>
                  ) : construction.stageStatus === "in_progress" ? (
                    <span>
                      <span style={{ color: "rgb(251, 191, 36)" }}>In Progress:</span>{" "}
                      {simplifyStage(construction.currentStage)}
                    </span>
                  ) : construction.stageStatus === "completed" && construction.currentStage ? (
                    <span>
                      <span style={{ color: "rgb(52, 211, 153)" }}>Stage Completed:</span>{" "}
                      {simplifyStage(construction.currentStage)}
                    </span>
                  ) : (
                    <span style={{ color: "#6B7280" }}>Not Started</span>
                  )}
                </div>
              </div>
            )}

            {activePlot.sheetData.type && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Type</span> 
                <strong style={(() => {
                  const tRaw = String(activePlot.sheetData.type || "").trim();
                  const t = tRaw.toLowerCase();
                  if (!t) return {};

                  // Standard (e.g. "Standard East", "Standard West") => white
                  if (/^standard\b/.test(t) || t === "normal") {
                    return { color: "#ffffff" };
                  }

                  // Corners => gold
                  if (/(ne|nw|se|sw)\s*corner/.test(t)) {
                    return { color: "rgb(234, 179, 8)", textShadow: "0 0 8px rgba(234, 179, 8, 0.55)" };
                  }

                  // Park Facing (e.g. "Park Facing East/West") => lilac
                  if (/park\s*(facing|view)/.test(t)) {
                    return { color: "rgb(216, 180, 254)", textShadow: "0 0 8px rgba(216, 180, 254, 0.55)" };
                  }

                  // default
                  return { color: "#e5e7eb" };
                })()}>
                  {activePlot.sheetData.type}
                </strong>
              </div>
            )}
            {activePlot.sheetData.facing && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Facing</span> 
                <strong>{activePlot.sheetData.facing}</strong>
              </div>
            )}
            {activePlot.sheetData.sqft && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Sq. Ft</span> 
                <strong>{activePlot.sheetData.sqft}</strong>
              </div>
            )}
            {activePlot.sheetData.plotSize && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Plot Size</span> 
                <strong>{activePlot.sheetData.plotSize} SqYds</strong>
              </div>
            )}
            
            {/* View Floor Plans Button - shown only when a URL exists for that facing */}
            {(() => {
              const FLOOR_PLAN_URLS = {
                east: 'https://drive.google.com/file/d/16m5LTSeN2MuMwhSc22tpJkM2AsOqthCa/view?usp=sharing',
                west: 'https://drive.google.com/file/d/1Q7zZnkQX-RIu9a4vCLbxMe-YAGHQWg9P/view?usp=sharing',
              };
              // Explicit mapping. Specific labels (e.g. "Standard East", "NE Corner",
              // "Park Facing East") come from the sheet's type column (D); plain
              // "East"/"West" come from the facing column (C). We check both.
              const EAST_LABELS = new Set([
                'ne corner',
                'se corner',
                'standard east',
                'park facing east',
                'east',
              ]);
              const WEST_LABELS = new Set([
                'nw corner',
                'sw corner',
                'standard west',
                'park facing west',
                'west',
              ]);
              const facing = String(activePlot.sheetData?.facing || "").trim().toLowerCase();
              const type = String(activePlot.sheetData?.type || "").trim().toLowerCase();
              let direction = null;
              if (EAST_LABELS.has(type) || EAST_LABELS.has(facing)) direction = "east";
              else if (WEST_LABELS.has(type) || WEST_LABELS.has(facing)) direction = "west";
              const url = direction ? FLOOR_PLAN_URLS[direction] : null;
              if (!url) return null;
              return (
                <button
                  onClick={() => window.open(url, '_blank')}
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: `${Math.max(3, Math.round(ui.pad * 0.25))}px ${Math.max(6, Math.round(ui.pad * 0.5))}px`,
                    fontSize: `${ui.text}px`,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: `${Math.max(2, Math.round(ui.pad * 0.2))}px`,
                    width: '100%',
                    fontFamily: 'var(--font-twk-issey), sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f0f0f0';
                    e.target.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ffffff';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  View Floor Plans
                </button>
              );
            })()}
          </div>
        ) : (
          <div style={{color: "#999", fontSize: `${ui.text}px`}}>This is a common area.</div>
        )}
      </div>
    </motion.div>
  );
}

// Export as both named and default for compatibility
export default Tooltip;
