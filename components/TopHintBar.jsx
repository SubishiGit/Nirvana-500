"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOOLTIP_SURFACE = {
  background: "rgba(15, 15, 20, 0.75)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
};

const EASE_SMOOTH = [0.22, 1, 0.36, 1];
const DURATION_SIZE = 0.52;
const DURATION_TEXT = 0.38;

const sizeTransition = {
  type: "tween",
  duration: DURATION_SIZE,
  ease: EASE_SMOOTH,
};

const textTransition = {
  type: "tween",
  duration: DURATION_TEXT,
  ease: EASE_SMOOTH,
};

// Vertical layout: width is the short axis, height is the long axis.
const WIDTH_EXPANDED = "clamp(260px, 30vw, 380px)";
const WIDTH_MINIMIZED = "clamp(44px, 6vw, 60px)";
const HEIGHT_EXPANDED = "clamp(420px, 80vh, 660px)";
const HEIGHT_MINIMIZED = "clamp(260px, 56vh, 440px)";

const SECTION_HEADERS = [
  "Standard East",
  "Standard West",
  "NE Corner",
  "NW Corner",
  "SE Corner",
  "SW Corner",
  "Park Facing East",
  "Park Facing West",
];

const ZERO_CAPS = [0, 0, 0, 0, 0, 0, 0, 0];

function normalizeCaps8(c) {
  if (!Array.isArray(c) || c.length !== 8) return ZERO_CAPS.slice();
  return c.map((x) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.round(n) : 0;
  });
}

/** Spine-less leftward arrow (triangle only), centered on the panel's left edge */
function LeftArrow() {
  return (
    <div
      aria-hidden
      style={{
        width: 8,
        height: 14,
        marginRight: -1,
        background: "rgba(15, 15, 20, 0.75)",
        clipPath: "polygon(0 50%, 100% 0, 100% 100%)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
      }}
    />
  );
}

export function TopHintBar({ containerWidth = 1024, caps }) {
  const [minimized, setMinimized] = useState(true);
  const safeCaps = useMemo(() => normalizeCaps8(caps), [caps]);
  const sections = useMemo(
    () => SECTION_HEADERS.map((header, i) => ({ header, value: safeCaps[i] })),
    [safeCaps]
  );

  const toggle = useCallback(() => {
    setMinimized((v) => !v);
  }, []);

  const headerFs =
    containerWidth >= 900 ? 20 : containerWidth >= 450 ? 17 : 14;
  const numFs =
    containerWidth >= 900 ? 52 : containerWidth >= 450 ? 42 : 32;
  const minimizedFs =
    containerWidth >= 900 ? 14 : containerWidth >= 450 ? 13 : 12;

  const divider = "1px solid rgba(255, 255, 255, 0.18)";

  return (
    <div
      style={{
        position: "fixed",
        right: 10,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <LeftArrow />
      <motion.div
        initial={false}
        animate={{
          width: minimized ? WIDTH_MINIMIZED : WIDTH_EXPANDED,
          height: minimized ? HEIGHT_MINIMIZED : HEIGHT_EXPANDED,
          paddingTop: minimized ? 14 : 12,
          paddingBottom: minimized ? 14 : 12,
          paddingLeft: minimized ? 8 : 14,
          paddingRight: minimized ? 8 : 14,
        }}
        transition={{
          ...sizeTransition,
          scale: { type: "tween", duration: 0.22, ease: EASE_SMOOTH },
        }}
        whileHover={minimized ? { scale: 1.025 } : undefined}
        style={{
          ...TOOLTIP_SURFACE,
          borderRadius: 14,
          pointerEvents: "auto",
          cursor: "pointer",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          transformOrigin: "right center",
        }}
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        aria-expanded={!minimized}
        aria-label={
          minimized
            ? "Expand Villa CAPS dashboard"
            : "Minimize Villa CAPS dashboard"
        }
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: minimized ? "center" : "flex-start",
            overflowX: "hidden",
            overflowY: minimized ? "hidden" : "auto",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {minimized ? (
              <motion.div
                key="min-label"
                initial={{ opacity: 0, x: 4, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -4, filter: "blur(4px)" }}
                transition={textTransition}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    color: "#ffffff",
                    fontFamily: "var(--font-twk-issey), sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    lineHeight: 1.35,
                    textAlign: "center",
                    fontSize: minimizedFs,
                    writingMode: "vertical-rl",
                    textOrientation: "mixed",
                    whiteSpace: "nowrap",
                  }}
                >
                  Click to view current Villa CAPS
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="caps-list"
                initial={{ opacity: 0, x: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -6, filter: "blur(4px)" }}
                transition={textTransition}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  width: "100%",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {sections.map((row, i) => (
                  <div
                    key={row.header}
                    style={{
                      flex: "1 1 0",
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      paddingTop: 4,
                      paddingBottom: 4,
                      paddingLeft: 6,
                      paddingRight: 6,
                      borderTop: i === 0 ? "none" : divider,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: "var(--font-twk-issey), sans-serif",
                        fontSize: headerFs,
                        fontWeight: 700,
                        color: "rgba(255, 255, 255, 0.95)",
                        letterSpacing: "0.02em",
                        lineHeight: 1.15,
                        textAlign: "left",
                      }}
                    >
                      {row.header}
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        fontFamily: "var(--font-twk-issey), sans-serif",
                        fontSize: numFs,
                        fontWeight: 700,
                        color:
                          row.value <= 0
                            ? "rgb(255, 0, 0)"
                            : "rgb(34, 211, 238)",
                        letterSpacing: "0.02em",
                        lineHeight: 1,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {row.value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default TopHintBar;
