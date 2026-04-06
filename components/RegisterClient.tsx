"use client";

import Link from "next/link";
import { useState } from "react";
import { HomeIcon, KeyIcon, MailIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";
import Spinner from "@/components/Spinner";

export default function RegisterClient() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");

  async function onSubmit(formData: FormData) {
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    if (password !== confirmPassword) {
      setMessage("Security keys do not match.");
      return;
    }

    setLoading(true);
    setMessage("");
    const payload = Object.fromEntries(formData.entries());
    delete payload.confirmPassword;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || "Onboarding failed");
      return;
    }

    setEmailForOtp(json.email);
    setMessage("Account initialized. Tactical OTP transmitted.");
  }

  return (
    <div className="tactical-dark bg-secure min-h-screen stack center" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <Link href="/" style={{ position: "absolute", top: "24px", left: "24px", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--muted)", fontWeight: 700, fontSize: "0.9rem" }}>
         <div className="icon-pill" style={{ width: "32px", height: "32px", background: "var(--panel-soft)" }}>
            <HomeIcon size={16} color="var(--brand)" />
         </div>
         Back to Home
      </Link>
      <section className="glass-panel stack" style={{ width: "min(500px, 100%)", padding: "40px", borderRadius: "32px", gap: "24px" }}>
        <div className="stack center" style={{ textAlign: "center", gap: "10px" }}>
          <BrandLogo size={40} color="#3b82f6" />
          <h1 className="title" style={{ fontSize: "1.8rem" }}>Create Your Account</h1>
          <p className="muted" style={{ fontSize: "0.9rem" }}>Sign up to get started with the Rescue Bird community.</p>
        </div>

        <form
          className="grid"
          style={{ gap: "16px" }}
          action={async (fd) => {
            await onSubmit(fd);
          }}
        >
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
             <input 
               name="name" 
               placeholder="Full Name" 
               required 
             />
             <input 
               name="phone" 
               placeholder="Comms (Phone)" 
             />
          </div>

          <label className="field-with-icon">
            <span className="field-icon"><MailIcon size={16} color="#3b82f6" /></span>
            <input 
              name="email" 
              type="email" 
              placeholder="Email Address" 
              required 
              style={{ paddingLeft: "44px" }} 
            />
          </label>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field-with-icon">
              <span className="field-icon"><KeyIcon size={16} color="#3b82f6" /></span>
              <input 
                name="password" 
                type="password" 
                placeholder="Password" 
                required 
                style={{ paddingLeft: "44px" }} 
              />
            </label>
            <label className="field-with-icon">
              <span className="field-icon"><KeyIcon size={16} color="#3b82f6" /></span>
              <input 
                name="confirmPassword" 
                type="password" 
                placeholder="Confirm Password" 
                required 
                style={{ paddingLeft: "44px" }} 
              />
            </label>
          </div>

          <button type="submit" className="brand" disabled={loading} style={{ padding: "16px", borderRadius: "16px", marginTop: "8px" }}>
            {loading ? <Spinner label="Setting up account" /> : "Create Account"}
          </button>
        </form>

        {message ? (
          <div className={`tag ${message.includes('Security') ? 'danger' : 'success'}`} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
            {message}
          </div>
        ) : null}

        {emailForOtp ? (
          <Link href={`/verify?email=${encodeURIComponent(emailForOtp)}`} style={{ width: "100%" }}>
            <button className="secondary" style={{ width: "100%", border: "1px solid #3b82f6", color: "#3b82f6" }}>Enter Transmission (Verify OTP)</button>
          </Link>
        ) : null}

        <p className="muted" style={{ textAlign: "center", fontSize: "0.9rem", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--brand)", fontWeight: 700 }}>Log In</Link>
        </p>
      </section>
    </div>
  );
}
