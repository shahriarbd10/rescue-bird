import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie, signSession } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import UserModel from "@/models/User";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    await connectDb();
    const user = await UserModel.findOne({ email: body.email.toLowerCase().trim() });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    if (!user.verifiedAt) {
      return NextResponse.json({ error: "Verify OTP before login", requiresOtp: true }, { status: 403 });
    }

    const token = await signSession(String(user._id), user.role);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role, teamId: user.teamId }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to login";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
