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
  const [viewportHeight, setViewportHeight] = useState(900);
  const controls = useAnimation();

  useEffect(() => {
    setMounted(true);
    const syncViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setViewportHeight(window.innerHeight || 900);
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const heights = useMemo(() => {
    if (isDesktop) {
      const standard = Math.round(Math.max(520, Math.min(viewportHeight * 0.64, 760)));
      const expanded = Math.round(Math.max(620, Math.min(viewportHeight * 0.84, viewportHeight - 60)));
      return {
        mini: "148px",
        standard: `${standard}px`,
        expanded: `${expanded}px`
      };
    }

    const standard = Math.round(Math.max(420, Math.min(viewportHeight * 0.62, 680)));
    const expanded = Math.round(Math.max(520, Math.min(viewportHeight * 0.86, viewportHeight - 56)));
    return {
      mini: "112px",
      standard: `${standard}px`,
      expanded: `${expanded}px`
    };
  }, [isDesktop, viewportHeight]);

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
    const threshold = 60; // Lower threshold for faster response

    if (onSnapChange) {
      if (velocity.y < -200 || offset.y < -threshold) {
        // Dragged UP
        if (snapPoint === "mini") onSnapChange("standard");
        else if (snapPoint === "standard") onSnapChange("expanded");
        else onSnapChange("expanded");
      } else if (velocity.y > 200 || offset.y > threshold) {
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
        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
        className={`bottom-sheet-shell`} 
        role="dialog" 
        aria-modal={isOpen && snapPoint !== "mini"}
        drag={isDesktop ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{
          position: "fixed",
          bottom: 0,
          left: isDesktop ? "24px" : 0,
          right: isDesktop ? "auto" : 0,
          margin: isDesktop ? "0" : "0 auto",
          width: isDesktop ? "400px" : "min(600px, 100%)",
          maxHeight: isDesktop ? "90vh" : "90vh",
          background: "var(--bg-2)",
          borderTopLeftRadius: "var(--radius-lg)",
          borderTopRightRadius: "var(--radius-lg)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.2)",
          zIndex: 1450, 
          display: "flex",
          flexDirection: "column",
          padding: isDesktop ? "24px" : "12px 16px env(safe-area-inset-bottom, 16px)",
          border: "1px solid var(--line)",
          touchAction: snapPoint === "expanded" ? "pan-y" : "none"
        }}
      >
        {!isDesktop && (
          <div 
            className="sheet-handle-wrapper" 
            style={{ 
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 20px",
              cursor: "grab",
              flexShrink: 0
            }}
          >
            <div className="sheet-handle" />
          </div>
        )}
        
        <div 
          className="bottom-sheet-content"
          style={{ 
            flex: 1, 
            overflowY: snapPoint === "mini" ? "hidden" : "auto",
            opacity: snapPoint === "mini" ? 0.4 : 1,
            transition: "opacity 0.2s ease",
            paddingBottom: isDesktop ? "0" : "140px",
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
