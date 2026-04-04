"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { KeyIcon, MailIcon, ShieldIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";
import Spinner from "@/components/Spinner";

type Props = { initialEmail?: string };

export default function VerifyOtpClient({ initialEmail = "" }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage("");
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || "OTP verification failed");
      return;
    }

    setMessage("Email verified successfully. You can now login.");
  }

  async function resendOtp() {
    if (!email) {
      setMessage("Enter your email to resend OTP.");
      return;
    }
    setResendLoading(true);
    setMessage("");
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    setResendLoading(false);
    if (!res.ok) {
      setMessage(json.error || "Failed to resend OTP");
      return;
    }
    setCountdown(30);
    setMessage("OTP resent successfully.");
  }

  return (
    <div className="auth-wrap">
      <section className="auth-brand stack">
        <span className="tag hero-tag">
          <ShieldIcon size={14} />
          Verification
        </span>
        <div className="row">
          <BrandLogo />
          <strong>Email confirmation</strong>
        </div>
        <h1 className="title">Activate your account</h1>
        <p>Enter the six-digit OTP from your email to complete account activation.</p>
        <Image
          className="auth-image"
          src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80"
          alt="Rescue response and emergency deployment"
          width={1200}
          height={800}
        />
        <div className="tile">
          <strong>Need help?</strong>
          <p className="muted">Check spam or promotions if OTP did not arrive in your inbox yet.</p>
        </div>
      </section>

      <section className="auth-panel stack">
        <h2 className="subhead">OTP Verification</h2>
        <form
          className="grid"
          action={async (fd) => {
            setEmail(String(fd.get("email") || ""));
            await onSubmit(fd);
          }}
        >
          <label className="field-with-icon">
            <span className="field-icon">
              <MailIcon size={16} />
            </span>
            <input name="email" type="email" defaultValue={email} placeholder="Email address" required />
          </label>
          <label className="field-with-icon">
            <span className="field-icon">
              <KeyIcon size={16} />
            </span>
            <input name="code" placeholder="6-digit OTP" maxLength={6} required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? <Spinner label="Verifying" /> : "Verify OTP"}
          </button>
        </form>
        <button className="secondary" onClick={resendOtp} disabled={resendLoading || countdown > 0}>
          {resendLoading ? <Spinner label="Resending" /> : countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
        </button>
        {message ? <p className="muted status-msg">{message}</p> : null}
        <p className="muted">
          Back to <Link href="/login">Login</Link>
        </p>
      </section>
    </div>
  );
}
