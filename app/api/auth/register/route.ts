import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { otpMailTemplate } from "@/lib/mail-templates";
import { sendSmtpMail } from "@/lib/smtp-mail";
import OtpCodeModel from "@/models/OtpCode";
import UserModel, { userRoles } from "@/models/User";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  password: z.string().min(6),
  role: z.enum(userRoles),
  teamId: z.string().optional()
});

function randomOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await connectDb();

    const email = body.email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email });
    const passwordHash = await bcrypt.hash(body.password, 10);

    let user = existing;
    if (!user) {
      user = await UserModel.create({
        name: body.name.trim(),
        email,
        phone: body.phone,
        passwordHash,
        role: body.role,
        teamId: body.teamId && mongoose.isValidObjectId(body.teamId) ? new mongoose.Types.ObjectId(body.teamId) : null,
        verifiedAt: null
      });
    } else {
      user.name = body.name.trim();
      user.phone = body.phone;
      user.passwordHash = passwordHash;
      user.role = body.role;
      user.teamId = body.teamId && mongoose.isValidObjectId(body.teamId) ? new mongoose.Types.ObjectId(body.teamId) : null;
      user.verifiedAt = null;
      await user.save();
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

    return NextResponse.json({ ok: true, email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
