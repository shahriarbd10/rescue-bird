import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { otpMailTemplate } from "@/lib/mail-templates";
import { sendSmtpMail } from "@/lib/smtp-mail";
import OtpCodeModel from "@/models/OtpCode";
import UserModel from "@/models/User";

const schema = z.object({
  email: z.string().email()
});

function randomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await connectDb();

    const email = body.email.toLowerCase().trim();
    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (user.verifiedAt) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    const code = randomOtp();
    await OtpCodeModel.deleteMany({ email, purpose: "verify-email" });
    await OtpCodeModel.create({
      email,
      code,
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
