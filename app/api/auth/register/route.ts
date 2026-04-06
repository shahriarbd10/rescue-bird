import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { otpMailTemplate } from "@/lib/mail-templates";
import { generateOtpCode, hashOtpCode } from "@/lib/otp";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import { sendSmtpMail } from "@/lib/smtp-mail";
import OtpCodeModel from "@/models/OtpCode";
import UserModel from "@/models/User";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`auth:register:ip:${ip}`, { limit: 12, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.ok) {
      return tooManyRequests(ipLimit.retryAfterSeconds, "Too many registration attempts from this network.");
    }

    const body = schema.parse(await req.json());
    await connectDb();

    const email = body.email.toLowerCase().trim();
    const emailLimit = checkRateLimit(`auth:register:email:${email}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!emailLimit.ok) {
      return tooManyRequests(emailLimit.retryAfterSeconds, "Too many registration attempts for this email.");
    }

    const existing = await UserModel.findOne({ email });
    if (existing) {
      if (existing.verifiedAt) {
        return NextResponse.json({ error: "Account already exists. Please login." }, { status: 409 });
      }
      return NextResponse.json(
        { error: "An account with this email already exists and is pending verification. Please verify OTP." },
        { status: 409 }
      );
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await UserModel.create({
      name: body.name.trim(),
      email,
      phone: body.phone,
      passwordHash,
      role: "user",
      teamId: null,
      verifiedAt: null
    });

    const code = generateOtpCode();
    const codeHash = hashOtpCode(email, code);
    await OtpCodeModel.deleteMany({ email, purpose: "verify-email" });
    await OtpCodeModel.create({
      email,
      codeHash,
      purpose: "verify-email",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendSmtpMail({
      to: email,
      subject: "Rescue Bird OTP verification",
      html: otpMailTemplate(user.name, code)
    });

    return NextResponse.json({ ok: true, email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
