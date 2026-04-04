"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { KeyIcon, MailIcon, ShieldIcon, UsersIcon } from "@/components/BrandIcons";
import BrandLogo from "@/components/BrandLogo";
import Spinner from "@/components/Spinner";

const roles = [
  { value: "user", label: "User" },
  { value: "rescue_team", label: "Rescue Team" },
  { value: "team_staff", label: "Team Staff" },
  { value: "admin", label: "Admin" }
];

export default function RegisterClient() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");

  async function onSubmit(formData: FormData) {
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    if (password !== confirmPassword) {
      setMessage("Password and confirm password do not match.");
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
      setMessage(json.error || "Registration failed");
      return;
    }

    setEmailForOtp(json.email);
    setMessage("Account created. OTP sent to your email.");
  }

  return (
    <div className="auth-wrap">
      <section className="auth-brand stack">
        <span className="tag hero-tag">
          <ShieldIcon size={14} />
          Rescue Bird
        </span>
        <div className="row">
          <BrandLogo />
          <strong>Rescue Bird Identity</strong>
        </div>
        <h1 className="title">Create account</h1>
        <p>Role-based onboarding for emergency users, teams, and staff under one trusted platform.</p>
        <Image
          className="auth-image"
          src="https://images.unsplash.com/photo-1615461066159-fea0960485d5?auto=format&fit=crop&w=1200&q=80"
          alt="Rescue operations team preparing for emergency response"
          width={1200}
          height={800}
        />
        <div className="list">
          <div className="tile feature-tile">
            <span className="icon-pill soft">
              <MailIcon />
            </span>
            <strong>OTP-secured signup</strong>
            <p className="muted">All accounts are verified by email before login is enabled.</p>
          </div>
          <div className="tile feature-tile">
            <span className="icon-pill soft">
              <UsersIcon />
            </span>
            <strong>Team-aware role model</strong>
            <p className="muted">Team staff can be linked with team ID for operational coordination.</p>
          </div>
        </div>
      </section>

      <section className="auth-panel stack">
        <h2 className="subhead">Registration</h2>
        <form
          className="grid"
          action={async (fd) => {
            await onSubmit(fd);
          }}
        >
          <input name="name" placeholder="Full name" required />
          <label className="field-with-icon">
            <span className="field-icon">
              <MailIcon size={16} />
            </span>
            <input name="email" type="email" placeholder="Email address" required />
          </label>
          <input name="phone" placeholder="Phone number (optional)" />
          <label className="field-with-icon">
            <span className="field-icon">
              <KeyIcon size={16} />
            </span>
            <input name="password" type="password" placeholder="Password" required />
          </label>
          <label className="field-with-icon">
            <span className="field-icon">
              <KeyIcon size={16} />
            </span>
            <input name="confirmPassword" type="password" placeholder="Confirm password" required />
          </label>
          <select name="role" defaultValue="user">
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <input name="teamId" placeholder="Team ID (only for team staff)" />
          <button type="submit" disabled={loading}>
            {loading ? <Spinner label="Creating account" /> : "Create Account"}
          </button>
        </form>

        {message ? <p className="muted status-msg">{message}</p> : null}
        {emailForOtp ? (
          <Link href={`/verify?email=${encodeURIComponent(emailForOtp)}`}>
            <button className="secondary">Verify OTP</button>
          </Link>
        ) : null}

        <p className="muted">
          Already registered? <Link href="/login">Login</Link>
        </p>
      </section>
    </div>
  );
}
