"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BoltIcon, HomeIcon, KeyIcon, MailIcon, ShieldIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";
import Spinner from "@/components/Spinner";

export default function LoginClient() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (json.requiresOtp) {
        const email = String(payload.email || "");
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      setMessage(json.error || "Login failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="tactical-dark bg-secure min-h-screen stack center" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <Link href="/" style={{ position: "absolute", top: "24px", left: "24px", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--muted)", fontWeight: 700, fontSize: "0.9rem" }}>
         <div className="icon-pill" style={{ width: "32px", height: "32px", background: "var(--panel-soft)" }}>
            <HomeIcon size={16} color="var(--brand)" />
         </div>
         Back to Home
      </Link>
      <section className="glass-panel stack" style={{ width: "min(440px, 100%)", padding: "40px", borderRadius: "32px", gap: "24px" }}>
        <div className="stack center" style={{ textAlign: "center", gap: "12px" }}>
          <BrandLogo size={48} color="#3b82f6" />
          <span className="tag" style={{ background: "rgba(37, 99, 235, 0.1)", color: "var(--brand)" }}>
            Rescue Bird Portal
          </span>
          <h1 className="title" style={{ fontSize: "2rem" }}>Welcome Back</h1>
          <p className="muted" style={{ fontSize: "0.95rem" }}>Please log in to your account to continue.</p>
        </div>

        <form className="grid" style={{ gap: "20px" }} onSubmit={onSubmit}>
          <div className="stack" style={{ gap: "8px" }}>
            <label className="muted" style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Email Address</label>
            <label className="field-with-icon">
              <span className="field-icon">
                <MailIcon size={18} color="#3b82f6" />
              </span>
              <input 
                name="email" 
                type="email" 
                placeholder="your@email.com" 
                required 
                style={{ paddingLeft: "44px" }}
              />
            </label>
          </div>

          <div className="stack" style={{ gap: "8px" }}>
            <label className="muted" style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Password</label>
            <label className="field-with-icon">
              <span className="field-icon">
                <KeyIcon size={18} color="#3b82f6" />
              </span>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                style={{ paddingLeft: "44px" }}
              />
            </label>
          </div>

          <button type="submit" className="brand" disabled={loading} style={{ padding: "16px", borderRadius: "16px", fontSize: "1rem", marginTop: "12px" }}>
            {loading ? <Spinner label="Logging in" /> : "Log In"}
          </button>
        </form>

        {message ? (
          <div className="tag danger" style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            {message}
          </div>
        ) : null}

        <div className="row center" style={{ marginTop: "12px", borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            New to Rescue Bird? <Link href="/register" style={{ color: "var(--brand)", fontWeight: 700 }}>Create Account</Link>
          </p>
        </div>
      </section>
      
      <div className="desktop-only" style={{ position: "fixed", bottom: "24px", right: "24px" }}>
         <div className="row" style={{ gap: "12px" }}>
            <ShieldIcon color="rgba(255,255,255,0.2)" />
            <BoltIcon color="rgba(255,255,255,0.2)" />
            <BrandLogo size={24} color="rgba(255,255,255,0.1)" />
         </div>
      </div>
    </div>
  );
}
