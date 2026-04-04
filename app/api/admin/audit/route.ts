import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";

export async function GET(req: NextRequest) {
  const user = await requireApiAuth(req);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  await connectDb();
  const messages = await MessageModel.find().sort({ createdAt: -1 }).limit(200).lean();
  const users = await UserModel.find().select("-passwordHash").sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ messages, users });
}
