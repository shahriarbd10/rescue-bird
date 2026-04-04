import Link from "next/link";
import Image from "next/image";
import { BoltIcon, CompassIcon, ShieldIcon, UsersIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <main className="page stack motion-page marketing-shell">
      <section className="hero stack marketing-hero" style={{ padding: "40px 24px", textAlign: "center", alignItems: "center" }}>
        <div className="row center" style={{ marginBottom: "16px" }}>
          <BrandLogo size={48} />
        </div>
        <span className="tag hero-tag" style={{ marginBottom: "8px" }}>
          <ShieldIcon size={14} />
          Bangladesh Tactical Response
        </span>
        <h1 className="title" style={{ fontSize: "3rem", marginBottom: "12px" }}>Rescue Bird</h1>
        <p style={{ maxWidth: "480px", margin: "0 auto 24px", fontSize: "1.1rem" }}>
          Next-generation tactical coordination for citizens and rescue squads. 
          Signal emergencies, track responders, and coordinate help in real-time.
        </p>
        <div className="btn-row center" style={{ width: "100%", justifyContent: "center", gap: "16px" }}>
          <Link href="/register" style={{ flex: 1, maxWidth: "200px" }}>
            <button style={{ width: "100%", padding: "16px", borderRadius: "18px", fontSize: "1rem" }}>Initialize Account</button>
          </Link>
          <Link href="/login" style={{ flex: 1, maxWidth: "200px" }}>
            <button className="secondary" style={{ width: "100%", padding: "16px", borderRadius: "18px", fontSize: "1rem" }}>Secure Login</button>
          </Link>
        </div>
        <div className="hero-image-grid" style={{ marginTop: "40px", width: "100%" }}>
          <Image
            className="section-image"
            src="/images/rescue-operations.svg"
            alt="Rescue"
            width={600}
            height={400}
            style={{ height: "180px" }}
          />
          <Image
            className="section-image"
            src="/images/rescue-teamwork.svg"
            alt="Coordination"
            width={600}
            height={400}
            style={{ height: "180px" }}
          />
        </div>
      </section>

      <section className="kpi-grid marketing-kpis">
        <div className="kpi kpi-rich">
          <span className="icon-pill">
            <UsersIcon />
          </span>
          <p className="v">4</p>
          <p className="l">Account types</p>
        </div>
        <div className="kpi kpi-rich">
          <span className="icon-pill">
            <CompassIcon />
          </span>
          <p className="v">Area + Geo</p>
          <p className="l">Smart team assignment</p>
        </div>
        <div className="kpi kpi-rich">
          <span className="icon-pill">
            <ShieldIcon />
          </span>
          <p className="v">OTP</p>
          <p className="l">Email verification flow</p>
        </div>
        <div className="kpi kpi-rich">
          <span className="icon-pill">
            <BoltIcon />
          </span>
          <p className="v">Audit</p>
          <p className="l">Admin traceability</p>
        </div>
      </section>

      <section className="card marketing-features">
        <h2 className="subhead">How It Works</h2>
        <div className="section-image-grid">
          <Image
            className="section-image"
            src="/images/rescue-relief.svg"
            alt="Flood rescue operation"
            width={900}
            height={600}
          />
          <Image
            className="section-image"
            src="/images/rescue-command.svg"
            alt="Emergency command and communication center"
            width={900}
            height={600}
          />
          <Image
            className="section-image"
            src="/images/rescue-night.svg"
            alt="Volunteer rescue teams supporting emergency response"
            width={900}
            height={600}
          />
        </div>
        <div className="list">
          <div className="tile feature-tile">
            <span className="icon-pill">
              <BoltIcon />
            </span>
            <strong>User sends emergency alert</strong>
            <p className="muted">Location, area, short note, and optional voice-note URL from mobile webview.</p>
          </div>
          <div className="tile feature-tile">
            <span className="icon-pill">
              <CompassIcon />
            </span>
            <strong>Best rescue team gets matched</strong>
            <p className="muted">The system evaluates configured service areas and nearby team location radius.</p>
          </div>
          <div className="tile feature-tile">
            <span className="icon-pill">
              <UsersIcon />
            </span>
            <strong>Rescue team and staff respond</strong>
            <p className="muted">Staff can accept and resolve incidents with shared communication visibility.</p>
          </div>
          <div className="tile feature-tile">
            <span className="icon-pill">
              <ShieldIcon />
            </span>
            <strong>Admin sees full communication record</strong>
            <p className="muted">Message sender identity is preserved for governance and operational oversight.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
