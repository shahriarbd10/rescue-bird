"use client";

import React, { ReactNode, useEffect, useState } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  showOverlay?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  showOverlay = true
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <>
      {showOverlay && (
        <div className="bottom-sheet-overlay" onClick={onClose} />
      )}
      <div className="bottom-sheet" role="dialog" aria-modal="true">
        <div className="bottom-sheet-handle" onClick={onClose} />
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
}
