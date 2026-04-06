import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { isValidLatLng } from "@/lib/validation";
import AlertModel from "@/models/Alert";
import RescueTeamModel from "@/models/RescueTeam";
import UserModel from "@/models/User";

export async function GET(req: NextRequest) {
  const actor = await requireApiAuth(req);
  if (!actor) return unauthorized();
  await connectDb();

  if (actor.role === "admin") {
    const [users, teams, alerts] = await Promise.all([
      UserModel.find({
        "currentLocation.lat": { $ne: null },
        "currentLocation.lng": { $ne: null }
      })
        .select("name role currentLocation lastLocationAt")
        .lean(),
      RescueTeamModel.find({
        "location.lat": { $ne: null },
        "location.lng": { $ne: null }
      })
        .select("name location coverageRadiusKm phone areaNames")
        .lean(),
      AlertModel.find({
        "location.lat": { $ne: null },
        "location.lng": { $ne: null }
      })
        .select("area status location createdAt assignedTeamId")
        .sort({ createdAt: -1 })
        .limit(300)
        .lean()
    ]);

    return NextResponse.json({
      role: actor.role,
      users,
      teams,
      alerts
    });
  }

  if (actor.role === "user") {
    const [alerts, teams] = await Promise.all([
      AlertModel.find({
        userId: actor._id,
        "location.lat": { $ne: null },
        "location.lng": { $ne: null }
      })
        .select("area status location createdAt assignedTeamId")
        .sort({ createdAt: -1 })
        .limit(80)
        .lean(),
      RescueTeamModel.find({
        "location.lat": { $ne: null },
        "location.lng": { $ne: null }
      })
        .select("name location coverageRadiusKm phone areaNames")
        .sort({ createdAt: -1 })
        .lean()
    ]);

    return NextResponse.json({
      role: actor.role,
      users: [
        {
          _id: actor._id,
          name: actor.name,
          role: actor.role,
          currentLocation: actor.currentLocation || null,
          lastLocationAt: actor.lastLocationAt || null
        }
      ],
      teams,
      alerts
    });
  }

  let teamId = actor.teamId ? String(actor.teamId) : null;
  if (actor.role === "rescue_team" && !teamId) {
    const ownTeam = await RescueTeamModel.findOne({ ownerUserId: actor._id }).select("_id").lean();
    if (ownTeam?._id) teamId = String(ownTeam._id);
  }

  if (!teamId) {
    return NextResponse.json({ role: actor.role, users: [], teams: [], alerts: [] });
  }

  const [team, alerts] = await Promise.all([
    RescueTeamModel.findById(teamId).select("name location coverageRadiusKm phone areaNames").lean(),
    AlertModel.find({
      assignedTeamId: teamId,
      status: { $in: ["open", "accepted"] },
      "location.lat": { $ne: null },
      "location.lng": { $ne: null }
    })
      .select("area status location createdAt assignedTeamId")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
  ]);

  return NextResponse.json({
    role: actor.role,
    users: [],
    teams: team ? [team] : [],
    alerts
  });
}

export async function POST(req: NextRequest) {
  const actor = await requireApiAuth(req);
  if (!actor) return unauthorized();

  if (!["user", "rescue_team", "team_staff", "admin"].includes(actor.role)) {
    return forbidden();
  }

  const body = await req.json();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!isValidLatLng(lat, lng)) {
    return NextResponse.json({ error: "Invalid location coordinates" }, { status: 400 });
  }

  await connectDb();
  actor.currentLocation = { lat, lng };
  actor.lastLocationAt = new Date();
  await actor.save();

  return NextResponse.json({ ok: true });
}
