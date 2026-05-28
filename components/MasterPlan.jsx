"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { InteractiveCanvas } from "./InteractiveCanvas";
import { useProgressiveImage } from "./ImageLoader";
import { VirtualizedPlots } from "./VirtualizedPlots";
import { extractVillaKey } from "./idUtil";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip } from "./Tooltip";
import { TopHintBar } from "./TopHintBar";
import UILayerPortal from "./UILayerPortal";
import { Range, getTrackBackground } from "react-range";

function envFlagTrue(value) {
  if (value == null || value === "") return false;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

// Live sheet polling is on by default. Set NEXT_PUBLIC_SHEET_POLLING=false to disable.
function envFlagFalse(value) {
  if (value == null || value === "") return false;
  return ["0", "false", "no", "off"].includes(String(value).trim().toLowerCase());
}

function sheetPollIntervalMs() {
  const raw = parseInt(process.env.NEXT_PUBLIC_SHEET_POLL_MS || "4000", 10);
  if (!Number.isFinite(raw)) return 4000;
  return Math.max(3000, Math.min(120_000, raw));
}

const ZERO_CAPS = [0, 0, 0, 0, 0, 0, 0, 0];

/** App theme accent (welcome, chrome glows, primary CTAs). Not used for filter availability / plot colors. */
const THEME_ACCENT = "#67e8f9";
const THEME_ACCENT_HOVER = "#22d3ee";

function normalizeCaps(c) {
  if (!Array.isArray(c) || c.length !== 8) return ZERO_CAPS.slice();
  return c.map((x) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.round(n) : 0;
  });
}

export default function MasterPlan({ mapData, sheetRows = [], sheetCaps }) {
  const [activePlot, setActivePlot] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentZoom, setCurrentZoom] = useState(1);
  const [tooltipSticky, setTooltipSticky] = useState(false);
  const [stickyPosition, setStickyPosition] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Simple filter state for future expansion
  const [showFilters, setShowFilters] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [matchedPlotIds, setMatchedPlotIds] = useState(new Set());
  const [filters, setFilters] = useState({
    availability: new Set(),
    facing: new Set(),
    sqftRange: null, // [min,max]
    plotSizeRange: null // [min,max]
  });
  // Track which thumb is active to control z-index so overlapped thumbs work like one control
  const [activeThumb, setActiveThumb] = useState(null); // kept if needed later
  const [isFilterHover, setIsFilterHover] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const filterBtnRef = useRef(null);
  const panelRef = useRef(null);
  // Responsive sizes for the filter button (desktop gets ~400% scale)
  const [btnUi, setBtnUi] = useState({ icon: 18, btn: 36, padX: 8, padY: 6, gap: 8, font: 14 });
  // Responsive sizes for instructions overlay
  const [instructionsUi, setInstructionsUi] = useState({ 
    title: 20, body: 14, button: 14, padding: 24, maxWidth: 400
  });
  // Responsive sizes for filter panel
  const [filterPanelUi, setFilterPanelUi] = useState({ 
    width: 220, padding: 10, fontSize: 12, buttonSize: 10
  });

  const sheetPollingEnabled = !envFlagFalse(process.env.NEXT_PUBLIC_SHEET_POLLING);
  const sheetPollMs = sheetPollIntervalMs();
  const [liveSheetRows, setLiveSheetRows] = useState(sheetRows);
  const [liveCaps, setLiveCaps] = useState(() => normalizeCaps(sheetCaps));

  useEffect(() => {
    if (sheetPollingEnabled) return;
    setLiveSheetRows(sheetRows);
    setLiveCaps(normalizeCaps(sheetCaps));
  }, [sheetRows, sheetCaps, sheetPollingEnabled]);

  useEffect(() => {
    if (!sheetPollingEnabled) return;

    let cancelled = false;
    let intervalId = null;

    const pull = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/plots", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.rows)) setLiveSheetRows(data.rows);
        if (!cancelled && Array.isArray(data.caps)) setLiveCaps(normalizeCaps(data.caps));
      } catch {
        /* ignore transient errors */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void pull();
    };

    document.addEventListener("visibilitychange", onVisibility);
    void pull();
    intervalId = window.setInterval(pull, sheetPollMs);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, [sheetPollingEnabled, sheetPollMs]);

  useEffect(() => {
    const updateBtnUi = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
      if (w >= 900) {
        // Desktop (compact to leave room for tooltips)
        setBtnUi({ icon: 42, btn: 42, padX: 9, padY: 7, gap: 8, font: 14 });
        setInstructionsUi({ 
          title: 28, body: 18, button: 16, padding: 40, maxWidth: 600
        });
        setFilterPanelUi({ 
          width: 320, padding: 20, fontSize: 14, buttonSize: 12
        });
      } else if (w >= 768) {
        // Tablet
        setBtnUi({ icon: 20, btn: 32, padX: 7, padY: 6, gap: 7, font: 13 });
        setInstructionsUi({ 
          title: 24, body: 16, button: 15, padding: 32, maxWidth: 500
        });
        setFilterPanelUi({ 
          width: 260, padding: 16, fontSize: 13, buttonSize: 11
        });
      } else if (w >= 450) {
        // Mobile
        setBtnUi({ icon: 15, btn: 30, padX: 7, padY: 5, gap: 6, font: 12 });
        setInstructionsUi({ 
          title: 16, body: 12, button: 12, padding: 16, maxWidth: 300
        });
        setFilterPanelUi({ 
          width: 220, padding: 10, fontSize: 12, buttonSize: 10
        });
      } else {
        // Very small screens (Framer embed)
        setBtnUi({ icon: 11, btn: 24, padX: 5, padY: 4, gap: 5, font: 10 });
        setInstructionsUi({ 
          title: 12, body: 9, button: 9, padding: 12, maxWidth: 200
        });
        setFilterPanelUi({ 
          width: 180, padding: 8, fontSize: 10, buttonSize: 8
        });
      }
    };
    updateBtnUi();
    window.addEventListener('resize', updateBtnUi);
    return () => window.removeEventListener('resize', updateBtnUi);
  }, []);
  
  // Base layer image loading (single asset; no placeholder)
  const { currentSrc, isLoading } = useProgressiveImage('/baselayer.jpg');
  
  // Track container size for responsive behavior
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setContainerSize({ width, height });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Close filter panel on click-away (outside button and panel)
  useEffect(() => {
    if (!showFilters) return;
    const handlePointerDown = (e) => {
      const target = e.target;
      if (panelRef.current && panelRef.current.contains(target)) return;
      if (filterBtnRef.current && filterBtnRef.current.contains(target)) return;
      setShowFilters(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showFilters]);
  
  // Memoized aspect ratio calculation
  const aspectRatio = useMemo(() => {
    if (!mapData.viewBox) return "16 / 9";
    const [, , width, height] = mapData.viewBox.split(' ').map(Number);
    return width && height ? `${width} / ${height}` : "16 / 9";
  }, [mapData.viewBox]);
  
  // Calculate responsive dimensions
  const responsiveDimensions = useMemo(() => {
    const isVerySmall = containerSize.width < 450;
    const isMobile = containerSize.width >= 450 && containerSize.width < 900;
    const isTablet = containerSize.width >= 900 && containerSize.width < 1200;
    
    if (isVerySmall) {
      // Very small screens (Framer embed): Use full screen width, let height adjust naturally
      return {
        width: '100%',
        minWidth: 'auto',
        minHeight: 'auto',
        maxWidth: 'none',
        aspectRatio: aspectRatio
      };
    } else if (isMobile) {
      // Mobile: Use full screen width, let height adjust naturally
      return {
        width: '100%',
        minWidth: 'auto',
        minHeight: 'auto',
        maxWidth: 'none',
        aspectRatio: aspectRatio
      };
    } else if (isTablet) {
      // Tablet: Slightly larger minimum with responsive scaling
      return {
        width: '100%',
        minWidth: '600px',
        minHeight: '400px', 
        maxWidth: '900px',
        aspectRatio: aspectRatio
      };
    } else {
      // Desktop: Current behavior but with responsive max
      return {
        width: '100%',
        minWidth: '800px',
        minHeight: '500px',
        maxWidth: '1800px',
        aspectRatio: aspectRatio
      };
    }
  }, [containerSize.width, aspectRatio]);
  
  
  // Optimized villa data mapping with caching
  const villaDataMap = useMemo(() => {
    const map = new Map();
    for (const row of liveSheetRows) {
      const key = extractVillaKey(row.id);
      if (key) map.set(key, row);
    }
    return map;
  }, [liveSheetRows]);

  // Derived plots with performance optimization
  const derivedPlots = useMemo(() => {
    if (!mapData.plots) return [];
    
    return mapData.plots.map(plot => {
      let plotType = 'villa', color = 'transparent', sheetData = null;
      
      if (/CLUBHOUSE/i.test(plot.id)) {
        plotType = 'clubhouse';
        color = "rgba(168, 85, 247, 0.7)";
      } else if (/CANAL|LANDSCAPE/i.test(plot.id)) {
        plotType = 'canal';
        color = "rgba(59, 130, 246, 0.7)";
      } else {
        const key = extractVillaKey(plot.id);
        sheetData = key ? villaDataMap.get(key) : null;

        if (sheetData) {
          switch (sheetData.availability) {
            case "Sold": color = "rgb(255, 0, 0)"; break;         // red
            case "Blocked": color = "rgb(255, 255, 0)"; break;    // yellow
            default: color = "rgb(34, 211, 238)";                 // cyan (Available)
          }
        }
      }
      
      return { ...plot, plotType, sheetData, color };
    });
  }, [mapData.plots, villaDataMap]);

  // Safe numeric parser that strips commas/whitespace
  const parseNum = useCallback((value) => {
    if (value === null || value === undefined) return NaN;
    const s = String(value).replace(/[,\s]/g, "");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }, []);

  // Bounds for ranges
  const sqftBounds = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const p of derivedPlots) {
      if (p.plotType === 'villa') {
        const v = parseNum(p.sheetData?.sqft);
        if (Number.isFinite(v)) { if (v < min) min = v; if (v > max) max = v; }
      }
    }
    return (min === Infinity || max === -Infinity) ? { min: 0, max: 0 } : { min, max };
  }, [derivedPlots, parseNum]);

  const plotSizeBounds = useMemo(() => {
    let min = Infinity, max = -Infinity;
    for (const p of derivedPlots) {
      if (p.plotType === 'villa') {
        const v = parseNum(p.sheetData?.plotSize);
        if (Number.isFinite(v)) { if (v < min) min = v; if (v > max) max = v; }
      }
    }
    return (min === Infinity || max === -Infinity) ? { min: 0, max: 0 } : { min, max };
  }, [derivedPlots, parseNum]);

  // Initialize ranges to full bounds once
  useEffect(() => {
    setFilters(prev => {
      const next = { ...prev };
      if (!next.sqftRange && (sqftBounds.max > sqftBounds.min)) next.sqftRange = [sqftBounds.min, sqftBounds.max];
      if (!next.plotSizeRange && (plotSizeBounds.max > plotSizeBounds.min)) next.plotSizeRange = [plotSizeBounds.min, plotSizeBounds.max];
      return next;
    });
  }, [sqftBounds.min, sqftBounds.max, plotSizeBounds.min, plotSizeBounds.max]);

  const computeMatchesFromFilters = useCallback((f) => {
    // consider ranges active only if narrowed from data bounds
    const sqftActive = !!(f.sqftRange && (f.sqftRange[0] > (sqftBounds.min ?? 0) || f.sqftRange[1] < (sqftBounds.max ?? 0)));
    const plotActive = !!(f.plotSizeRange && (f.plotSizeRange[0] > (plotSizeBounds.min ?? 0) || f.plotSizeRange[1] < (plotSizeBounds.max ?? 0)));
    const any = f.availability.size || f.facing.size || sqftActive || plotActive;
    if (!any) {
      setMatchedPlotIds(new Set());
      setHasActiveFilters(false);
      return;
    }
    const ids = new Set();
    for (const p of derivedPlots) {
      if (p.plotType !== 'villa') continue;
      const sd = p.sheetData || {};
      if (f.availability.size && !f.availability.has(sd.availability)) continue;
      if (f.facing.size) {
        const facingKey = String(sd.facing || "").trim();
        const typeKey = String(sd.type || "").trim();
        // Facing filter matches either:
        // - Column C: East/West (sd.facing)
        // - Column D: Type label (sd.type) like "NE Corner", "Park Facing East", etc.
        if (!f.facing.has(facingKey) && !f.facing.has(typeKey)) continue;
      }
      if (sqftActive) {
        const s = parseNum(sd.sqft);
        if (!(Number.isFinite(s) && s >= f.sqftRange[0] && s <= f.sqftRange[1])) continue;
      }
      if (plotActive) {
        const ps = parseNum(sd.plotSize);
        if (!(Number.isFinite(ps) && ps >= f.plotSizeRange[0] && ps <= f.plotSizeRange[1])) continue;
      }
      ids.add(p.id);
    }
    setMatchedPlotIds(ids);
    setHasActiveFilters(ids.size > 0);
  }, [derivedPlots, parseNum, sqftBounds.min, sqftBounds.max, plotSizeBounds.min, plotSizeBounds.max]);


  // Optimized mouse handlers with error handling
  const handleMouseMove = useCallback((e) => {
    if (!tooltipSticky) {
      const x = Number.isFinite(e.clientX) ? e.clientX : 0;
      const y = Number.isFinite(e.clientY) ? e.clientY : 0;
      setMousePosition({ x, y });
      
      // Clear tooltip if mouse is moving over background (not over SVG polygons)
      // This handles cases where mouse moves to empty areas between polygons
      if (e.target === e.currentTarget) {
        setActivePlot(null);
      }
    }
  }, [tooltipSticky]);

  // Detect if any filters are applied (independent of whether matches exist)
  const filtersApplied = useMemo(() => {
    const sqftActive = !!(filters.sqftRange && (filters.sqftRange[0] > (sqftBounds.min ?? 0) || filters.sqftRange[1] < (sqftBounds.max ?? 0)));
    const plotActive = !!(filters.plotSizeRange && (filters.plotSizeRange[0] > (plotSizeBounds.min ?? 0) || filters.plotSizeRange[1] < (plotSizeBounds.max ?? 0)));
    return (filters.availability?.size || 0) > 0 || (filters.facing?.size || 0) > 0 || sqftActive || plotActive;
  }, [filters, sqftBounds.min, sqftBounds.max, plotSizeBounds.min, plotSizeBounds.max]);

  // Build a concise summary of applied filters for the button
  const filterSummaryContent = useMemo(() => {
    if (!filtersApplied) return null;

    const statusColors = {
      Available: '#06b6d4',
      Sold: '#ef4444',
      Blocked: '#eab308'
    };

    const availabilityParts = Array.from(filters.availability || [])
      .map((s) => (
        <span key={s} style={{ color: statusColors[s] || '#D1D5DB', fontWeight: 700 }}>{s}</span>
      ));

    const facingArr = Array.from(filters.facing || []);
    const facingPart = facingArr.length > 0 ? (
      <span key="facing" style={{ color: '#000000' }}>
        {availabilityParts.length ? ' ' : ''}
        {facingArr.join('/')} Facing Villas
      </span>
    ) : null;

    const sqftActive = !!(filters.sqftRange && (filters.sqftRange[0] > (sqftBounds.min ?? 0) || filters.sqftRange[1] < (sqftBounds.max ?? 0)));
    const plotActive = !!(filters.plotSizeRange && (filters.plotSizeRange[0] > (plotSizeBounds.min ?? 0) || filters.plotSizeRange[1] < (plotSizeBounds.max ?? 0)));

    const rangeParts = [];
    if (sqftActive) {
      rangeParts.push(
        <span key="sqft" style={{ color: '#000000' }}>
          {`${Math.round(filters.sqftRange[0]).toLocaleString()}–${Math.round(filters.sqftRange[1]).toLocaleString()} Sq. Ft`}
        </span>
      );
    }
    if (plotActive) {
      rangeParts.push(
        <span key="plot" style={{ color: '#000000' }}>
          {`${Math.round(filters.plotSizeRange[0])}–${Math.round(filters.plotSizeRange[1])} SqYds`}
        </span>
      );
    }

    const pieces = [];
    if (availabilityParts.length) pieces.push(<span key="avail">{availabilityParts.reduce((acc, el, idx) => idx === 0 ? [el] : [...acc, <span key={`sep-a-${idx}`} style={{ color: '#9CA3AF' }}> / </span>, el], [])}</span>);
    if (facingPart) pieces.push(
      <span key="facing-wrap">
        {facingPart}
      </span>
    );
    if (rangeParts.length) {
      rangeParts.forEach((rp, idx) => {
        pieces.push(
          <span key={`range-${idx}`}>
            {pieces.length ? <span style={{ color: '#000000' }}>, </span> : null}
            {rp}
          </span>
        );
      });
    }

    if (pieces.length === 0) return null;

    return (
      <span style={{ fontSize: btnUi.font, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-twk-issey), sans-serif' }}>
        {pieces}
      </span>
    );
  }, [filtersApplied, filters, btnUi.font, sqftBounds.min, sqftBounds.max, plotSizeBounds.min, plotSizeBounds.max]);

  /** Viewport rectangle (filter control + open panel) the plot tooltip must not cover */
  const tooltipAvoidRect = useMemo(() => {
    if (containerSize.width <= 0) return null;
    const pad = 16;
    const leftInset = 24;
    const topInset = 24;
    const expandedBtnW = Math.min(containerSize.width * 0.62, 360);
    const panelW = Math.min(filterPanelUi.width, containerSize.width * 0.85);
    const reserveW = leftInset + (showFilters ? Math.max(expandedBtnW, panelW) : expandedBtnW) + pad;
    const btnOnlyH = topInset + btnUi.btn + pad;
    const panelH =
      topInset + btnUi.btn + 12 + Math.min(containerSize.height * 0.5, 520) + pad;
    const reserveH = showFilters ? panelH : btnOnlyH;
    return { top: 0, left: 0, right: reserveW, bottom: reserveH };
  }, [
    containerSize.width,
    containerSize.height,
    showFilters,
    filterPanelUi.width,
    btnUi.btn,
  ]);

  const handleMouseLeave = useCallback(() => {
    if (!tooltipSticky) {
      setActivePlot(null);
    }
  }, [tooltipSticky]);

  const handleVillaClick = useCallback((plot, event) => {
    setActivePlot(plot);
    setStickyPosition({ x: event.clientX, y: event.clientY });
    setTooltipSticky(true);
  }, []);

  const handlePlotHover = useCallback((plot) => {
    setActivePlot(plot);
  }, []);

  const handlePlotLeave = useCallback(() => {
    if (!tooltipSticky) {
      setActivePlot(null);
    }
  }, [tooltipSticky]);

  const handleTooltipHover = useCallback(() => {
    setTooltipSticky(true);
  }, []);

  const handleTooltipLeave = useCallback(() => {
    setTooltipSticky(false);
    setActivePlot(null);
  }, []);

  // Safe zoom change handler to prevent NaN values and clear tooltip during zoom
  const handleZoomChange = useCallback((zoom) => {
    const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
    setCurrentZoom(safeZoom);
    // Clear tooltip when zooming to avoid stale tooltips
    setActivePlot(null);
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-white text-center">
            <div
              className="animate-spin w-8 h-8 rounded-full mx-auto mb-4"
              style={{
                width: 32,
                height: 32,
                border: `2px solid ${THEME_ACCENT}`,
                borderTopColor: "transparent",
              }}
            />
            <p>Loading Master Plan...</p>
          </div>
        </div>
      )}

      <InteractiveCanvas
        minZoom={containerSize.width < 450 ? 0.8 : containerSize.width < 900 ? 0.7 : 0.6}
        maxZoom={containerSize.width < 450 ? 3 : containerSize.width < 900 ? 5 : 8}
        initialZoom={containerSize.width < 450 ? 0.9 : containerSize.width < 900 ? 0.8 : 0.9}
        onZoomChange={handleZoomChange}
      >
        <div 
          style={{ 
            position: 'relative',
            width: '100vw',
            height: '100vh',
            minWidth: '100%',
            minHeight: '100%'
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Base Layer Image */}
          <img
            src={currentSrc}
        alt="Master Plan Base Layer"
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            draggable={false}
          />

          {/* Interactive Plot Layer */}
          <VirtualizedPlots
            plots={derivedPlots}
        viewBox={mapData.viewBox}
            currentZoom={currentZoom}
            onPlotHover={handlePlotHover}
            onPlotLeave={handlePlotLeave}
            onPlotClick={handleVillaClick}
            activePlotId={activePlot?.id}
            matchedPlotIds={matchedPlotIds}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </InteractiveCanvas>

      {/* Tooltip: body portal z-80 so it stacks above filter UI (z-60) */}
      <UILayerPortal zIndex={80}>
        <AnimatePresence>
          {activePlot && (
            <Tooltip
              key={activePlot.id}
              activePlot={activePlot}
              position={mousePosition}
              zoomLevel={currentZoom}
              tooltipSticky={tooltipSticky}
              stickyPosition={stickyPosition}
              onTooltipHover={handleTooltipHover}
              onTooltipLeave={handleTooltipLeave}
              avoidRect={tooltipAvoidRect}
            />
          )}
        </AnimatePresence>
      </UILayerPortal>

      {/* Top hint bar: z-70 above filter (60), below plot tooltip (80) */}
      <UILayerPortal zIndex={70}>
        <TopHintBar containerWidth={containerSize.width} caps={liveCaps} />
      </UILayerPortal>

      {/* Instructions: portal z-100 so it stays above tooltip + filter portals */}
      {showInstructions && (
        <UILayerPortal zIndex={100}>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}
        >
          <div
            style={{
              background: 'rgba(15, 15, 20, 0.85)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 18,
              padding: `${instructionsUi.padding}px`,
              maxWidth: `${instructionsUi.maxWidth}px`,
              width: '90vw',
              color: '#ffffff',
              textAlign: 'center',
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 20px 40px rgba(103,232,249,0.32)`,
              animation: 'filterGlow 2s ease-in-out infinite'
            }}
          >
            <h2 style={{ fontSize: instructionsUi.title, fontWeight: 700, marginBottom: 16, color: THEME_ACCENT }}>
              Welcome to Nirvana 250
            </h2>
            
            <div style={{ fontSize: instructionsUi.body, lineHeight: 1.6, marginBottom: 24, color: '#D1D5DB' }}>
              {containerSize.width >= 900 ? (
                <>
                  <p style={{ marginBottom: 16 }}>
                    <strong style={{ color: '#ffffff' }}>Hover</strong> or <strong style={{ color: '#ffffff' }}>click</strong> on any villa to view detailed information
                  </p>
                  
                  <p style={{ marginBottom: 16 }}>
                    Use the <strong style={{ color: THEME_ACCENT }}>filter</strong> button in the <strong style={{ color: '#ffffff' }}>top-left</strong> corner
                  </p>
                  
                  <p>
                    <strong style={{ color: '#ffffff' }}>Drag</strong> to pan and <strong style={{ color: '#ffffff' }}>scroll</strong> to zoom
                  </p>
                </>
              ) : containerSize.width >= 450 ? (
                <>
                  <p style={{ marginBottom: 12 }}>
                    <strong style={{ color: '#ffffff' }}>Please</strong> <strong style={{ color: '#ffffff' }}>turn your phone horizontal</strong> for a better viewing experience
                  </p>
                  
                  <p style={{ marginBottom: 12 }}>
                    <strong style={{ color: '#ffffff' }}>Tap villas</strong> for details.
                  </p>
                  
                  <p>
                    Use <strong style={{ color: THEME_ACCENT }}>filter</strong> to search.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: 8 }}>
                    <strong style={{ color: '#ffffff' }}>Tap villas</strong> for details.
                  </p>
                  
                  <p style={{ marginBottom: 8 }}>
                    Use <strong style={{ color: THEME_ACCENT }}>filter</strong> to search.
                  </p>
                  
                  <p>
                    <strong style={{ color: '#ffffff' }}>Drag</strong> to pan and <strong style={{ color: '#ffffff' }}>scroll</strong> to zoom
                  </p>
                </>
              )}
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                background: THEME_ACCENT,
                color: '#000000',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: instructionsUi.button,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-twk-issey), sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = THEME_ACCENT_HOVER;
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = THEME_ACCENT;
                e.target.style.transform = 'scale(1)';
              }}
            >
              Get Started
            </button>
          </div>
        </div>
        </UILayerPortal>
      )}

      {/* Outer-layer UI via portal with padded position */}
      <UILayerPortal zIndex={60}>
        {/* Use pure inline styles to avoid any utility class conflicts */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
          {/* Button */}
          {/* Hover swap: icon-only -> expanded button in same position */}
          {/* Hide filter button on mobile until instructions are dismissed */}
          {(containerSize.width >= 450 || !showInstructions) && (
            <div
              ref={filterBtnRef}
              onMouseEnter={() => setIsFilterHover(true)}
              onMouseLeave={() => setIsFilterHover(false)}
              style={{ position: 'fixed', top: 24, left: 24, pointerEvents: 'auto', height: btnUi.btn }}
            >
            <AnimatePresence initial={false}>
              {!(isFilterHover || (filtersApplied && !showFilters)) && (
                <motion.button
                  key="icon-only"
                  onClick={() => setShowFilters(!showFilters)}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 16, mass: 0.9, bounce: 0.35 }}
                  aria-label="Open filters"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    color: '#000000',
                    width: btnUi.btn,
                    height: btnUi.btn,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(103,232,249,0.45), 0 0 20px rgba(103,232,249,0.35)',
                    cursor: 'pointer',
                    animation: 'filterGlow 2s ease-in-out infinite'
                  }}
                >
                  <svg width={btnUi.icon} height={btnUi.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" fill="#000000"/>
                  </svg>
                </motion.button>
              )}
              {(isFilterHover || (filtersApplied && !showFilters)) && (
                <motion.button
                  key="expanded"
                  onClick={() => setShowFilters(!showFilters)}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 130, damping: 15, mass: 0.95, bounce: 0.3 }}
                  aria-label="Open filters"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    color: '#000000',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: btnUi.gap,
                    padding: `0px ${btnUi.padX}px`,
                    height: btnUi.btn,
                    maxWidth: 'min(62vw, 360px)',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(103,232,249,0.45), 0 0 20px rgba(103,232,249,0.35)',
                    cursor: 'pointer',
                    animation: 'filterGlow 2s ease-in-out infinite'
                  }}
                >
                  <svg width={btnUi.icon} height={btnUi.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" fill="#000000"/>
                  </svg>
                  {filtersApplied ? (
                    <>
                      <span style={{ color: '#000000', fontWeight: 600 }}> = </span>
                      {filterSummaryContent}
                    </>
                  ) : (
                    <span style={{ fontSize: btnUi.font, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'var(--font-twk-issey), sans-serif' }}>Filter</span>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
            </div>
          )}

          {/* Panel */}
          {showFilters && (
            <div
              ref={panelRef}
              style={{
                position: 'fixed',
                top: 24 + btnUi.btn + 12,
                left: 24,
                background: 'rgba(15, 15, 20, 0.75)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                borderRadius: 14,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                pointerEvents: 'auto',
                padding: filterPanelUi.padding,
                width: `min(${filterPanelUi.width}px, 85vw)`,
                maxHeight: '50vh',
                overflow: 'hidden auto'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 10 
              }}>
                <div style={{ fontSize: filterPanelUi.fontSize, fontWeight: 700, letterSpacing: 0.2, fontFamily: 'var(--font-twk-issey), sans-serif' }}>Villa Filters</div>
                <div
                  onClick={() => {
                    const reset = {
                      availability: new Set(),
                      facing: new Set(),
                      sqftRange: sqftBounds.max > sqftBounds.min ? [sqftBounds.min, sqftBounds.max] : null,
                      plotSizeRange: plotSizeBounds.max > plotSizeBounds.min ? [plotSizeBounds.min, plotSizeBounds.max] : null
                    };
                    setFilters(reset);
                    computeMatchesFromFilters(reset);
                  }}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    padding: `${Math.max(4, filterPanelUi.buttonSize - 2)}px ${Math.max(8, filterPanelUi.buttonSize + 2)}px`,
                    borderRadius: 6,
                    fontSize: filterPanelUi.buttonSize,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-twk-issey), sans-serif',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'scale(1)'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Clear
                </div>
              </div>
              {/* Availability */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: filterPanelUi.fontSize - 1, color: '#D1D5DB', marginBottom: 6, fontFamily: 'var(--font-twk-issey), sans-serif' }}>Availability</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Available','Sold','Blocked'].map(label => {
                    const isSelected = filters.availability?.has(label);
                    const bg = isSelected
                      ? (label === 'Available' ? '#06b6d4' : label === 'Sold' ? '#ef4444' : '#eab308')
                      : '#374151';
                    const color = isSelected
                      ? (label === 'Blocked' ? '#000' : '#fff')
                      : '#D1D5DB';
                    return (
                      <div key={label}
                        onClick={() => {
                          setFilters(prev => {
                            const next = { ...prev, availability: new Set(prev.availability) };
                            if (next.availability.has(label)) next.availability.delete(label); else next.availability.add(label);
                            computeMatchesFromFilters(next);
                            return next;
                          });
                        }}
                        className="filter-btn-bounce"
                        style={{
                          backgroundColor: bg,
                          color,
                          padding: `${Math.max(4, filterPanelUi.buttonSize - 2)}px ${Math.max(6, filterPanelUi.buttonSize)}px`,
                          borderRadius: 8,
                          fontSize: filterPanelUi.buttonSize,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-twk-issey), sans-serif',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: 'scale(1)'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Facing */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: filterPanelUi.fontSize - 1, color: '#D1D5DB', marginBottom: 6, fontFamily: 'var(--font-twk-issey), sans-serif' }}>Facing</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    'East',
                    'West',
                    'North',
                    'Standard East',
                    'Standard West',
                    'NE Corner',
                    'NW Corner',
                    'SE Corner',
                    'SW Corner',
                    'Park Facing East',
                    'Park Facing West'
                  ].map(f => (
                    <div key={f}
                      onClick={() => {
                        setFilters(prev => {
                          const next = { ...prev, facing: new Set(prev.facing) };
                          if (next.facing.has(f)) next.facing.delete(f); else next.facing.add(f);
                          computeMatchesFromFilters(next);
                          return next;
                        });
                      }}
                      style={{
                        backgroundColor: '#374151',
                        color: '#D1D5DB',
                        padding: `${Math.max(4, filterPanelUi.buttonSize - 2)}px ${Math.max(6, filterPanelUi.buttonSize)}px`,
                        borderRadius: 8,
                        fontSize: filterPanelUi.buttonSize,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: filters.facing?.has(f) ? '0 0 0 2px #10b981 inset' : 'none',
                        fontFamily: 'var(--font-twk-issey), sans-serif',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: 'scale(1)'
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </div>

            {/* Sq. Ft Range - react-range dual thumb */}
            {(sqftBounds.max > sqftBounds.min) && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: filterPanelUi.fontSize - 1, color: '#D1D5DB', marginBottom: 6, fontFamily: 'var(--font-twk-issey), sans-serif' }}>Sq. Ft</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: filterPanelUi.fontSize - 1, color: '#D1D5DB', marginBottom: 6, fontFamily: 'var(--font-twk-issey), sans-serif' }}>
                  <span>{Math.round((filters.sqftRange?.[0] ?? sqftBounds.min)).toLocaleString()}</span>
                  <span>{Math.round((filters.sqftRange?.[1] ?? sqftBounds.max)).toLocaleString()}</span>
                </div>
                <Range
                  values={[filters.sqftRange ? filters.sqftRange[0] : sqftBounds.min, filters.sqftRange ? filters.sqftRange[1] : sqftBounds.max]}
                  step={1}
                  min={Math.floor(sqftBounds.min)}
                  max={Math.ceil(sqftBounds.max)}
                  onChange={(vals) => {
                    const next = { ...filters, sqftRange: [vals[0], vals[1]] };
                    setFilters(next);
                    computeMatchesFromFilters(next);
                  }}
                  renderTrack={({ props, children }) => (
                    <div
                      onMouseDown={props.onMouseDown}
                      onTouchStart={props.onTouchStart}
                      style={{ ...props.style, height: 24, display: 'flex', width: '100%' }}
                    >
                      <div
                        ref={props.ref}
                        style={{
                          height: 6,
                          width: '100%',
                          borderRadius: 4,
                          background: getTrackBackground({
                            values: [filters.sqftRange ? filters.sqftRange[0] : sqftBounds.min, filters.sqftRange ? filters.sqftRange[1] : sqftBounds.max],
                            colors: ['#4b5563', '#06b6d4', '#4b5563'],
                            min: Math.floor(sqftBounds.min),
                            max: Math.ceil(sqftBounds.max)
                          }),
                          alignSelf: 'center'
                        }}
                      >
                        {children}
                      </div>
                    </div>
                  )}
                  renderThumb={({ props }) => {
                    const { key, style, ...rest } = props;
                    return (
                      <div
                        key={key}
                        {...rest}
                        style={{
                          ...style,
                          height: 18,
                          width: 18,
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          border: '2px solid #06b6d4'
                        }}
                      />
                    );
                  }}
                />
              </div>
            )}

            {/* Plot Size Range (SqYds) - react-range dual thumb */}
            {(plotSizeBounds.max > plotSizeBounds.min) && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: filterPanelUi.fontSize - 1, color: '#D1D5DB', marginBottom: 6, fontFamily: 'var(--font-twk-issey), sans-serif' }}>Plot Size (SqYds)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: filterPanelUi.fontSize - 1, color: '#D1D5DB', marginBottom: 6, fontFamily: 'var(--font-twk-issey), sans-serif' }}>
                  <span>{Math.round((filters.plotSizeRange?.[0] ?? plotSizeBounds.min))}</span>
                  <span>{Math.round((filters.plotSizeRange?.[1] ?? plotSizeBounds.max))}</span>
                </div>
                <Range
                  values={[filters.plotSizeRange ? filters.plotSizeRange[0] : plotSizeBounds.min, filters.plotSizeRange ? filters.plotSizeRange[1] : plotSizeBounds.max]}
                  step={1}
                  min={Math.floor(plotSizeBounds.min)}
                  max={Math.ceil(plotSizeBounds.max)}
                  onChange={(vals) => {
                    const next = { ...filters, plotSizeRange: [vals[0], vals[1]] };
                    setFilters(next);
                    computeMatchesFromFilters(next);
                  }}
                  renderTrack={({ props, children }) => (
                    <div
                      onMouseDown={props.onMouseDown}
                      onTouchStart={props.onTouchStart}
                      style={{ ...props.style, height: 24, display: 'flex', width: '100%' }}
                    >
                      <div
                        ref={props.ref}
                        style={{
                          height: 6,
                          width: '100%',
                          borderRadius: 4,
                          background: getTrackBackground({
                            values: [filters.plotSizeRange ? filters.plotSizeRange[0] : plotSizeBounds.min, filters.plotSizeRange ? filters.plotSizeRange[1] : plotSizeBounds.max],
                            colors: ['#4b5563', '#10b981', '#4b5563'],
                            min: Math.floor(plotSizeBounds.min),
                            max: Math.ceil(plotSizeBounds.max)
                          }),
                          alignSelf: 'center'
                        }}
                      >
                        {children}
                      </div>
                    </div>
                  )}
                  renderThumb={({ props }) => {
                    const { key, style, ...rest } = props;
            return (
                      <div
                        key={key}
                        {...rest}
                style={{
                          ...style,
                          height: 18,
                          width: 18,
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          border: '2px solid #10b981'
                        }}
                      />
                    );
                  }}
                />
              </div>
            )}

            </div>
          )}
        </div>
      </UILayerPortal>

    </div>
  );
}