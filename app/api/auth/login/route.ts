import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie, signSession } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";
import UserModel from "@/models/User";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`auth:login:ip:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.ok) {
      return tooManyRequests(ipLimit.retryAfterSeconds, "Too many login attempts from this network.");
    }

    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const emailLimit = checkRateLimit(`auth:login:email:${email}`, { limit: 12, windowMs: 15 * 60 * 1000 });
    if (!emailLimit.ok) {
      return tooManyRequests(emailLimit.retryAfterSeconds, "Too many login attempts for this account.");
    }

    await connectDb();
    const user = await UserModel.findOne({ email });
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
