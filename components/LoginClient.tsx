"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BoltIcon, KeyIcon, MailIcon, ShieldIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";
import Spinner from "@/components/Spinner";

export default function LoginClient() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage("");
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
    <div className="auth-wrap">
      <section className="auth-brand stack">
        <span className="tag hero-tag">
          <ShieldIcon size={14} />
          Secure Access
        </span>
        <div className="row">
          <BrandLogo />
          <strong>Rescue Bird Login</strong>
        </div>
        <h1 className="title">Welcome back</h1>
        <p>Sign in to continue emergency operations, alerts, and team communication.</p>
        <Image
          className="auth-image"
          src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80"
          alt="Emergency communication and field coordination"
          width={1200}
          height={800}
        />
        <div className="list">
          <div className="tile feature-tile">
            <span className="icon-pill soft">
              <BoltIcon />
            </span>
            <strong>Fast mobile sessions</strong>
            <p className="muted">Optimized for webview login and one-hand navigation in the field.</p>
          </div>
          <div className="tile feature-tile">
            <span className="icon-pill soft">
              <ShieldIcon />
            </span>
            <strong>Role-aware dashboard</strong>
            <p className="muted">Each account sees only the controls and data they need.</p>
          </div>
        </div>
      </section>

      <section className="auth-panel stack">
        <h2 className="subhead">Login</h2>
        <form
          className="grid"
          action={async (fd) => {
            await onSubmit(fd);
          }}
        >
          <label className="field-with-icon">
            <span className="field-icon">
              <MailIcon size={16} />
            </span>
            <input name="email" type="email" placeholder="Email address" required />
          </label>
          <label className="field-with-icon">
            <span className="field-icon">
              <KeyIcon size={16} />
            </span>
            <input name="password" type="password" placeholder="Password" required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? <Spinner label="Signing in" /> : "Login"}
          </button>
        </form>
        {message ? <p className="muted status-msg">{message}</p> : null}
        <p className="muted">
          New user? <Link href="/register">Create account</Link>
        </p>
      </section>
    </div>
  );
}
