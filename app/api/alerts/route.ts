import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { AlertPriority, computeNextEscalationAt, runEscalationCycle } from "@/lib/dispatch";
import { findTeamCandidates } from "@/lib/team-matcher";
import { isValidLatLng } from "@/lib/validation";
import AlertModel from "@/models/Alert";
import RescueTeamModel from "@/models/RescueTeam";

const createSchema = z.object({
  area: z.string().min(2),
  lat: z.number(),
  lng: z.number(),
  note: z.string().optional().default(""),
  voiceNoteUrl: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().default("high")
});

const actionSchema = z.object({
  alertId: z.string(),
  action: z.enum(["accept", "resolve", "escalate"])
});

export async function GET(req: NextRequest) {
  const user = await requireApiAuth(req);
  if (!user) return unauthorized();
  await connectDb();
  await runEscalationCycle();

  if (user.role === "admin") {
    const alerts = await AlertModel.find().sort({ createdAt: -1 }).limit(100).lean();
    return NextResponse.json({ alerts });
  }

  if (user.role === "user") {
    const alerts = await AlertModel.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({ alerts });
  }

  let teamId = user.teamId ? String(user.teamId) : null;
  if (user.role === "rescue_team" && !teamId) {
    const ownTeam = await RescueTeamModel.findOne({ ownerUserId: user._id }).lean();
    if (ownTeam?._id) teamId = String(ownTeam._id);
  }
  if (!teamId) return NextResponse.json({ alerts: [] });

  const alerts = await AlertModel.find({ assignedTeamId: teamId }).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const user = await requireApiAuth(req);
  if (!user) return unauthorized();
  await connectDb();

  const body = await req.json();
  if (body.mode === "action") {
    if (!["rescue_team", "team_staff", "admin"].includes(user.role)) return forbidden();
    const input = actionSchema.parse(body);
    const alert = await AlertModel.findById(input.alertId);
    if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    if (user.role !== "admin") {
      let actorTeamId = user.teamId ? String(user.teamId) : null;
      if (user.role === "rescue_team" && !actorTeamId) {
        const ownTeam = await RescueTeamModel.findOne({ ownerUserId: user._id }).select("_id").lean();
        if (ownTeam?._id) actorTeamId = String(ownTeam._id);
      }
      if (!actorTeamId) {
        return forbidden("You are not linked to a rescue team");
      }
      if (!alert.assignedTeamId || String(alert.assignedTeamId) !== actorTeamId) {
        return forbidden("You can only update alerts assigned to your team");
      }
    }

    if (input.action === "accept") {
      if (alert.status !== "open") {
        return NextResponse.json({ error: "Only open alerts can be accepted" }, { status: 409 });
      }
      alert.status = "accepted";
      alert.acceptedByUserId = user._id;
      alert.acceptedAt = new Date();
      alert.resolvedAt = null;
      alert.nextEscalationAt = null;
      alert.needsManualDispatch = false;
    } else {
      if (input.action === "resolve") {
        if (alert.status === "resolved") {
          return NextResponse.json({ error: "Alert is already resolved" }, { status: 409 });
        }
        alert.status = "resolved";
        if (!alert.acceptedAt) {
          alert.acceptedAt = new Date();
        }
        alert.resolvedAt = new Date();
        alert.nextEscalationAt = null;
        alert.needsManualDispatch = false;
      } else {
        if (alert.status !== "open") {
          return NextResponse.json({ error: "Only open alerts can be escalated" }, { status: 409 });
        }
        const candidates = Array.isArray(alert.escalationCandidates) ? alert.escalationCandidates : [];
        const nextIndex = (alert.escalationIndex || 0) + 1;
        if (nextIndex >= candidates.length) {
          alert.needsManualDispatch = true;
          alert.nextEscalationAt = null;
          await alert.save();
          return NextResponse.json({ ok: true, alert, message: "No more fallback teams; manual dispatch required" });
        }
        alert.assignedTeamId = candidates[nextIndex] || null;
        alert.escalationIndex = nextIndex;
        alert.escalatedAt = new Date();
        alert.nextEscalationAt = computeNextEscalationAt((alert.priority || "high") as AlertPriority);
        alert.needsManualDispatch = false;
      }
    }
    await alert.save();
    return NextResponse.json({ ok: true, alert });
  }

  if (user.role !== "user") return forbidden("Only users can create emergency alerts");
  const input = createSchema.parse(body);
  if (!isValidLatLng(input.lat, input.lng)) {
    return NextResponse.json({ error: "Latitude/longitude out of valid range" }, { status: 400 });
  }
  const candidates = await findTeamCandidates({ area: input.area, lat: input.lat, lng: input.lng }, 5);
  const assignedTeamId = candidates[0] || null;
  const priority = input.priority as AlertPriority;

  const alert = await AlertModel.create({
    userId: user._id,
    assignedTeamId,
    escalationCandidates: candidates,
    escalationIndex: 0,
    nextEscalationAt: assignedTeamId ? computeNextEscalationAt(priority) : null,
    needsManualDispatch: !assignedTeamId,
    area: input.area.trim(),
    location: { lat: input.lat, lng: input.lng },
    note: input.note.trim(),
    voiceNoteUrl: input.voiceNoteUrl.trim(),
    priority,
    status: "open"
  });

  return NextResponse.json({ ok: true, alert });
}
