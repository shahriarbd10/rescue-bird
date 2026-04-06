import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import AlertModel from "@/models/Alert";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";

export async function GET(req: NextRequest) {
  const user = await requireApiAuth(req);
  if (!user) return unauthorized();
  if (user.role !== "admin") return forbidden();

  await connectDb();
  const [messages, users, alerts] = await Promise.all([
    MessageModel.find().sort({ createdAt: -1 }).limit(200).lean(),
    UserModel.find().select("-passwordHash").sort({ createdAt: -1 }).limit(200).lean(),
    AlertModel.find()
      .select(
        "area status priority assignedTeamId createdAt acceptedAt resolvedAt escalatedAt nextEscalationAt needsManualDispatch updatedAt"
      )
      .sort({ createdAt: -1 })
      .limit(300)
      .lean()
  ]);
  return NextResponse.json({ messages, users, alerts });
}
