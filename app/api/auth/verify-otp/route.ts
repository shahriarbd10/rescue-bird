import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { greetingMailTemplate } from "@/lib/mail-templates";
import { sendSmtpMail } from "@/lib/smtp-mail";
import OtpCodeModel from "@/models/OtpCode";
import UserModel from "@/models/User";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await connectDb();

    const email = body.email.toLowerCase().trim();
    const otp = await OtpCodeModel.findOne({
      email,
      purpose: "verify-email",
      code: body.code,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otp) {
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
