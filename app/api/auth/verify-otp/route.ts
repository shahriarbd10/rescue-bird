import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { greetingMailTemplate } from "@/lib/mail-templates";
import { hashOtpCode, safeEqualHex } from "@/lib/otp";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { sendSmtpMail } from "@/lib/smtp-mail";
import OtpCodeModel from "@/models/OtpCode";
import UserModel from "@/models/User";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`auth:verify-otp:ip:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.ok) {
      return tooManyRequests(ipLimit.retryAfterSeconds, "Too many OTP verification attempts from this network.");
    }

    const body = schema.parse(await req.json());
    await connectDb();

    const email = body.email.toLowerCase().trim();
    const emailLimit = checkRateLimit(`auth:verify-otp:email:${email}`, { limit: 15, windowMs: 15 * 60 * 1000 });
    if (!emailLimit.ok) {
      return tooManyRequests(emailLimit.retryAfterSeconds, "Too many OTP verification attempts for this account.");
    }

    const otp = await OtpCodeModel.findOne({
      email,
      purpose: "verify-email",
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    const inputHash = hashOtpCode(email, body.code);
    const legacyCode = typeof otp?.code === "string" ? otp.code : "";
    const hashMatches = !!otp?.codeHash && safeEqualHex(otp.codeHash, inputHash);
    const legacyMatches = !!legacyCode && legacyCode === body.code;

    if (!otp || (!hashMatches && !legacyMatches)) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.verifiedAt = new Date();
    await user.save();
    await OtpCodeModel.deleteMany({ email, purpose: "verify-email" });

    await sendSmtpMail({
      to: email,
      subject: "Welcome to Rescue Bird",
      html: greetingMailTemplate(user.name, user.role)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify OTP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
