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
  email: z.string().email()
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`auth:resend-otp:ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.ok) {
      return tooManyRequests(ipLimit.retryAfterSeconds, "Too many OTP resend attempts from this network.");
    }

    const body = schema.parse(await req.json());
    await connectDb();

    const email = body.email.toLowerCase().trim();
    const emailLimit = checkRateLimit(`auth:resend-otp:email:${email}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!emailLimit.ok) {
      return tooManyRequests(emailLimit.retryAfterSeconds, "Too many OTP resend attempts for this account.");
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (user.verifiedAt) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resend OTP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
