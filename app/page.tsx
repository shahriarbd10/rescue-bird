"use client";

import Link from "next/link";
import Image from "next/image";
import { BoltIcon, CompassIcon, ShieldIcon, UsersIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <main className="tactical-dark bg-secure min-h-screen stack motion-page" style={{ padding: "0 0 100px" }}>
      {/* Tactical Header */}
      <header className="top-nav-shell" style={{ padding: "8px 16px", zIndex: 2000 }}>
        <div className="row space" style={{ flexWrap: "nowrap", gap: "12px" }}>
          <div className="row" style={{ flexWrap: "nowrap", gap: "12px" }}>
            <BrandLogo size={28} color="#3b82f6" />
            <ThemeToggle />
          </div>
          <div className="row" style={{ gap: "12px" }}>
            <Link href="/login" className="desktop-only">
               <button className="secondary" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem" }}>Login</button>
            </Link>
            <Link href="/register">
               <button className="brand" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem" }}>Deploy Now</button>
            </Link>
          </div>
        </div>
      </header>
      
      <style jsx>{`
        @media (min-width: 1024px) {
           .top-nav-shell { width: 600px !important; left: 50% !important; transform: translateX(-50%) !important; }
        }
      `}</style>

      {/* Premium Tactical Hero */}
      <section className="bg-hero-glow stack" style={{ padding: "120px 24px 40px", textAlign: "center", alignItems: "center" }}>
        <span className="tag hero-tag" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#3b82f6", border: "1px solid rgba(37,99,235,0.2)", marginBottom: "16px" }}>
          <ShieldIcon size={14} />
          Strategic Crisis Management Platform
        </span>
        <h1 className="title" style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", marginBottom: "20px", fontWeight: 900 }}>Rescue Bird</h1>
        <p style={{ maxWidth: "600px", margin: "0 auto 32px", fontSize: "1.25rem", color: "var(--muted)", lineHeight: "1.6" }}>
          The fastest way to get help during an emergency. 
          Connect with local rescue teams and stay updated on safety alerts in real-time.
        </p>
        <div className="btn-row center" style={{ width: "100%", justifyContent: "center", gap: "20px" }}>
          <Link href="/register" style={{ flex: 1, maxWidth: "240px" }}>
            <button className="brand" style={{ width: "100%", padding: "18px", borderRadius: "20px", fontSize: "1.1rem" }}>Join Now</button>
          </Link>
          <Link href="/login" style={{ flex: 1, maxWidth: "240px" }}>
            <button className="secondary glass-panel" style={{ width: "100%", padding: "18px", borderRadius: "20px", fontSize: "1.1rem", border: "1px solid var(--line)" }}>Log In</button>
          </Link>
        </div>
        
        {/* Mission Control Asset */}
        <div className="card glass-panel shadow-lg" style={{ marginTop: "60px", padding: "10px", width: "min(1000px, 100%)", borderRadius: "32px", overflow: "hidden", border: "1px solid var(--line)" }}>
          <Image
            className="section-image"
            src="/images/tactical_hero.png"
            alt="Tactical Command Center"
            width={1200}
            height={700}
            style={{ borderRadius: "24px", height: "auto" }}
          />
        </div>
      </section>

      {/* Modern Strategic KPIs */}
      <section className="page" style={{ padding: "40px 24px" }}>
        <div className="kpi-grid marketing-kpis" style={{ gap: "24px" }}>
          {[
            { icon: <UsersIcon color="#3b82f6" />, v: "Tactical Roles", l: "Admin, Team, Staff, Citizen" },
            { icon: <CompassIcon color="#3b82f6" />, v: "Geo-Fenced", l: "Dynamic area assignment" },
            { icon: <ShieldIcon color="#3b82f6" />, v: "Secure Portal", l: "OTP and encrypted identity" },
            { icon: <BoltIcon color="#3b82f6" />, v: "Full Audit", l: "Transparent coordination logs" }
          ].map((kpi, idx) => (
            <div className="kpi glass-panel" key={idx} style={{ border: "1px solid var(--line)", background: "var(--bg-2)" }}>
              <span className="icon-pill" style={{ background: "rgba(37, 99, 235, 0.1)" }}>{kpi.icon}</span>
              <p className="v" style={{ color: "var(--text)" }}>{kpi.v}</p>
              <p className="l">{kpi.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Field Intelligence Showcase */}
      <section className="page stack" style={{ padding: "40px 24px" }}>
        <div className="row space" style={{ marginBottom: "40px", alignItems: "flex-end" }}>
           <div className="stack" style={{ gap: "8px" }}>
              <h2 className="subhead" style={{ fontSize: "2.4rem", fontWeight: 800 }}>Field Mobility</h2>
              <p className="muted" style={{ maxWidth: "400px" }}>High-performance mobile coordination for the first responders on the ground.</p>
           </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", alignItems: "center" }}>
          <div className="card glass-panel" style={{ padding: "12px", borderRadius: "32px", border: "1px solid var(--line)" }}>
            <Image
              className="section-image"
              src="/images/mobile_mockup.png"
              alt="Mobile Application Preview"
              width={600}
              height={800}
              style={{ borderRadius: "24px", height: "auto" }}
            />
          </div>
          
          <div className="list">
            {[
              { icon: <BoltIcon />, title: "Quick Safety Alert", desc: "Send an emergency signal with your location in one tap." },
              { icon: <CompassIcon />, title: "Smart Team Matching", desc: "Our system connects you to the nearest available rescue squad." },
              { icon: <UsersIcon />, title: "Live Coordination", desc: "Stay in touch with rescue teams through real-time updates." },
              { icon: <ShieldIcon />, title: "Verified Help", desc: "All rescue teams are verified to ensure your safety and trust." }
            ].map((item, i) => (
              <div className="tile tactical-card glass-panel" key={i} style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
                <span className="icon-pill" style={{ background: "rgba(37, 99, 235, 0.1)" }}>{item.icon}</span>
                <div className="stack" style={{ gap: "4px" }}>
                  <strong style={{ color: "var(--text)" }}>{item.title}</strong>
                  <p className="muted" style={{ fontSize: "0.9rem" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="stack center" style={{ marginTop: "100px", padding: "0 24px" }}>
         <h2 className="title" style={{ fontSize: "2rem", marginBottom: "24px", color: "var(--text)" }}>Ready to respond?</h2>
         <Link href="/register"><button className="brand" style={{ padding: "16px 60px", borderRadius: "100px" }}>Deploy Now</button></Link>
      </section>
    </main>
  );
}
