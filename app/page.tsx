import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <main className="page motion-page">
      <section className="card stack" style={{ maxWidth: 620, margin: "8vh auto 0" }}>
        <div className="row" style={{ gap: 10 }}>
          <BrandLogo size={34} />
          <strong>Rescue Bird</strong>
        </div>

        <h1 className="title">Emergency Help, Faster</h1>
        <p className="muted">
          Mobile-first emergency alert and rescue coordination platform for Bangladesh.
        </p>

        <div className="btn-row">
          <Link href="/register">
            <button>Create Account</button>
          </Link>
          <Link href="/login">
            <button className="secondary">Login</button>
          </Link>
        </div>
      </section>
    </main>
  );
}
