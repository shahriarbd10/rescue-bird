"use client";

import React, { ReactNode, useEffect, useState, useMemo } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";

export type SnapPoint = "mini" | "standard" | "expanded";

interface BottomSheetProps {
  isOpen: boolean;
  snapPoint?: SnapPoint;
  onClose?: () => void;
  onSnapChange?: (snap: SnapPoint) => void;
  children: ReactNode;
  showOverlay?: boolean;
}

export default function BottomSheet({
  isOpen,
  snapPoint = "standard",
  onClose,
  onSnapChange,
  children,
  showOverlay = true
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    setMounted(true);
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const heights = useMemo(() => ({
    mini: "124px",
    standard: "50vh",
    expanded: "92vh" // Pulls up almost to the top
  }), []);

  useEffect(() => {
    if (mounted) {
      controls.start({ height: heights[snapPoint] });
    }
  }, [snapPoint, mounted, controls, heights]);

  if (!mounted) return null;

  const isVisible = isOpen || snapPoint === "mini";
  if (!isVisible) return null;

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (isDesktop) return;

    const { offset, velocity } = info;
    const threshold = 100;

    if (onSnapChange) {
      if (velocity.y < -300 || offset.y < -threshold) {
        // Dragged UP
        if (snapPoint === "mini") onSnapChange("standard");
        else if (snapPoint === "standard") onSnapChange("expanded");
        else onSnapChange("expanded"); // Stay expanded
      } else if (velocity.y > 300 || offset.y > threshold) {
        // Dragged DOWN
        if (snapPoint === "expanded") onSnapChange("standard");
        else if (snapPoint === "standard") onSnapChange("mini");
        else if (snapPoint === "mini" && onClose) onClose();
      }
    }
  };

  return (
    <>
      {showOverlay && isOpen && snapPoint !== "mini" && !isDesktop && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bottom-sheet-overlay" 
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 1400
          }}
        />
      )}
      
      <motion.div 
        layout
        initial={false}
        animate={controls}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`bottom-sheet-shell`} 
        role="dialog" 
        aria-modal={isOpen && snapPoint !== "mini"}
        drag={isDesktop ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        style={{
          position: "fixed",
          bottom: 0,
          left: isDesktop ? "24px" : 0,
          right: isDesktop ? "auto" : 0,
          margin: isDesktop ? "0" : "0 auto",
          width: isDesktop ? "400px" : "min(600px, 100%)",
          background: "var(--bg-2)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.2)",
          zIndex: 1450, 
          display: "flex",
          flexDirection: "column",
          padding: isDesktop ? "24px" : "12px 16px min(80px, calc(80px + env(safe-area-inset-bottom, 16px)))",
          border: "1px solid var(--line)",
          touchAction: "none"
        }}
      >
        {!isDesktop && (
          <div 
            className="sheet-handle" 
            style={{ 
              cursor: "grab",
              marginBottom: "16px",
              flexShrink: 0
            }}
          />
        )}
        
        <div 
          className="bottom-sheet-content"
          style={{ 
            flex: 1, 
            overflowY: snapPoint === "expanded" ? "auto" : "hidden",
            opacity: snapPoint === "mini" ? 0.4 : 1,
            transition: "opacity 0.2s ease",
            paddingBottom: isDesktop ? "0" : "80px",
            // Allow pointer events for content only when expanded or standard
            pointerEvents: snapPoint === "mini" ? "none" : "auto"
          }}
        >
          {children}
        </div>
      </motion.div>
    </>
  );
}
