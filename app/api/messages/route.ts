import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import MessageModel from "@/models/Message";
import RescueTeamModel from "@/models/RescueTeam";

const schema = z.object({
  teamId: z.string(),
  body: z.string().min(1).max(1000),
  receiverId: z.string().optional()
});

export async function GET(req: NextRequest) {
  const user = await requireApiAuth(req);
  if (!user) return unauthorized();
  await connectDb();

  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId is required" }, { status: 400 });

  const team = await RescueTeamModel.findById(teamId).lean();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const isTeamMember =
    user.role === "admin" ||
    String(team.ownerUserId) === String(user._id) ||
    (user.role === "team_staff" && String(user.teamId) === teamId);

  if (!isTeamMember && user.role !== "user") return forbidden();

  const filter = isTeamMember
    ? { teamId }
    : {
        teamId,
        $or: [{ senderId: user._id }, { receiverId: user._id }, { receiverId: null }]
      };

  const messages = await MessageModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(req: NextRequest) {
  const user = await requireApiAuth(req);
  if (!user) return unauthorized();
  await connectDb();

  const input = schema.parse(await req.json());
  const team = await RescueTeamModel.findById(input.teamId).lean();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const isTeamMember =
    user.role === "admin" ||
    String(team.ownerUserId) === String(user._id) ||
    (user.role === "team_staff" && String(user.teamId) === input.teamId);

  if (!isTeamMember && user.role !== "user") return forbidden();

  const message = await MessageModel.create({
    teamId: input.teamId,
    senderId: user._id,
    receiverId: input.receiverId || null,
    body: input.body.trim(),
    senderNameSnapshot: user.name,
    senderRoleSnapshot: user.role
  });

  return NextResponse.json({ ok: true, message });
}
