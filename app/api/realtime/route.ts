import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import AlertModel from "@/models/Alert";
import MessageModel from "@/models/Message";
import RescueTeamModel from "@/models/RescueTeam";

export const dynamic = "force-dynamic";

async function getActorTeamId(actorId: string, actorRole: string, actorTeamId: unknown) {
  if (actorTeamId) return String(actorTeamId);
  if (actorRole !== "rescue_team") return null;
  const ownTeam = await RescueTeamModel.findOne({ ownerUserId: actorId }).select("_id").lean();
  return ownTeam?._id ? String(ownTeam._id) : null;
}

async function getBaseSignature(actor: {
  _id: mongoose.Types.ObjectId;
  role: string;
  teamId?: mongoose.Types.ObjectId | null;
}) {
  if (actor.role === "admin") {
    const [latestAlert, latestTeam] = await Promise.all([
      AlertModel.findOne().sort({ updatedAt: -1 }).select("updatedAt").lean(),
      RescueTeamModel.findOne().sort({ updatedAt: -1 }).select("updatedAt").lean()
    ]);
    return `admin:${latestAlert?.updatedAt?.toISOString() || "0"}:${latestTeam?.updatedAt?.toISOString() || "0"}`;
  }

  if (actor.role === "user") {
    const latestAlert = await AlertModel.findOne({ userId: actor._id }).sort({ updatedAt: -1 }).select("updatedAt").lean();
    return `user:${latestAlert?.updatedAt?.toISOString() || "0"}`;
  }

  const teamId = await getActorTeamId(String(actor._id), actor.role, actor.teamId);
  if (!teamId) return `${actor.role}:none`;

  const [latestAlert, latestTeam] = await Promise.all([
    AlertModel.findOne({ assignedTeamId: teamId }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
    RescueTeamModel.findById(teamId).select("updatedAt").lean()
  ]);
  return `${actor.role}:${teamId}:${latestAlert?.updatedAt?.toISOString() || "0"}:${latestTeam?.updatedAt?.toISOString() || "0"}`;
}

async function getMessagesSignature(actor: {
  _id: mongoose.Types.ObjectId;
  role: string;
  teamId?: mongoose.Types.ObjectId | null;
}, teamId: string) {
  const team = await RescueTeamModel.findById(teamId).select("ownerUserId").lean();
  if (!team) return { error: "Team not found", status: 404 as const };

  const isTeamMember =
    actor.role === "admin" ||
    String(team.ownerUserId) === String(actor._id) ||
    (actor.role === "team_staff" && String(actor.teamId) === teamId);

  if (!isTeamMember && actor.role !== "user") return { error: "Forbidden", status: 403 as const };

  if (actor.role === "user") {
    const hasAlertForTeam = await AlertModel.exists({ userId: actor._id, assignedTeamId: teamId });
    if (!hasAlertForTeam) {
      return { error: "Forbidden", status: 403 as const };
    }
  }

  const filter = isTeamMember
    ? { teamId }
    : {
        teamId,
        $or: [{ senderId: actor._id }, { receiverId: actor._id }, { receiverId: null }]
      };

  const latestMessage = await MessageModel.findOne(filter).sort({ updatedAt: -1 }).select("updatedAt").lean();
  return { signature: `${teamId}:${latestMessage?.updatedAt?.toISOString() || "0"}` };
}

export async function GET(req: NextRequest) {
  const actor = await requireApiAuth(req);
  if (!actor) return unauthorized();
  await connectDb();

  const scope = req.nextUrl.searchParams.get("scope") || "base";
  const teamId = req.nextUrl.searchParams.get("teamId") || "";
  if (scope === "messages" && !mongoose.isValidObjectId(teamId)) {
    return forbidden("Invalid teamId");
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let previousSignature = "";

      const send = (event: string, payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const tick = async () => {
        if (closed) return;
        try {
          if (scope === "messages") {
            const current = await getMessagesSignature(actor, teamId);
            if ("error" in current) {
              send("error", { message: current.error });
              return;
            }
            if (current.signature !== previousSignature) {
              previousSignature = current.signature;
              send("refresh", { scope: "messages", teamId });
            }
            return;
          }

          const signature = await getBaseSignature(actor);
          if (signature !== previousSignature) {
            previousSignature = signature;
            send("refresh", { scope: "base" });
          }
        } catch {
          send("error", { message: "Realtime stream check failed" });
        }
      };

      controller.enqueue(encoder.encode(": connected\n\n"));
      void tick();
      const interval = setInterval(() => {
        void tick();
      }, 5000);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 15000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // ignore close race
        }
      });
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
