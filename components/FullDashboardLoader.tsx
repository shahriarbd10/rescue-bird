"use client";

import BrandLogo from "./BrandLogo";

export default function FullDashboardLoader() {
  return (
    <div className="tactical-dark bg-secure" style={{ 
      position: "fixed", 
      inset: 0, 
      zIndex: 5000, 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      gap: "24px",
      textAlign: "center",
      background: "var(--bg)"
    }}>
      <div className="pulse-loader-container">
        <div className="pulse-ring" />
        <div className="pulse-ring delay-1" />
        <div className="pulse-ring delay-2" />
        <BrandLogo size={64} color="var(--brand)" />
      </div>
      
      <div className="stack" style={{ gap: "8px" }}>
        <h2 className="title" style={{ fontSize: "1.5rem", fontWeight: 900 }}>Rescue Bird</h2>
        <p className="muted" style={{ fontSize: "0.9rem", maxWidth: "240px" }}>
          Synchronizing Rescue Network...
        </p>
      </div>

      <style jsx>{`
        .pulse-loader-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 120px;
          height: 120px;
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid var(--brand);
          border-radius: 35%;
          opacity: 0;
          animation: pulse-signal 2s cubic-bezier(0.25, 0, 0, 1) infinite;
        }

        .delay-1 { animation-delay: 0.5s; }
        .delay-2 { animation-delay: 1s; }

        @keyframes pulse-signal {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          50% {
            opacity: 0.2;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
