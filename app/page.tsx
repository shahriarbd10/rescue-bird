import Link from "next/link";
import Image from "next/image";
import { BoltIcon, CompassIcon, ShieldIcon, UsersIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <main className="page stack motion-page">
      <section className="hero stack">
        <span className="tag hero-tag">
          <ShieldIcon size={14} />
          Bangladesh Emergency Network
        </span>
        <div className="row">
          <BrandLogo />
          <strong>Rescue Bird Platform</strong>
        </div>
        <h1 className="title">Rescue Bird</h1>
        <p>
          A mobile-first emergency alert platform where users, rescue teams, and team staff coordinate fast help
          during critical moments.
        </p>
        <div className="btn-row">
          <Link href="/register">
            <button>Create Account</button>
          </Link>
          <Link href="/login">
            <button className="secondary">Login</button>
          </Link>
        </div>
        <div className="hero-image-grid">
          <Image
            src="/images/rescue-operations.svg"
            alt="Rescue response team in action"
            width={900}
            height={600}
          />
          <Image
            src="/images/rescue-teamwork.svg"
            alt="Disaster response and field coordination"
            width={900}
            height={600}
          />
        </div>
      </section>

      <section className="kpi-grid">
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

      <section className="card">
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
