import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { normalizeArea } from "@/lib/geo";
import RescueTeamModel from "@/models/RescueTeam";
import UserModel from "@/models/User";

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  areaNames: z.array(z.string()).optional().default([]),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  coverageRadiusKm: z.number().min(1).max(50).optional().default(5)
});

const patchSchema = z.object({
  teamId: z.string(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  areaNames: z.array(z.string()).optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  coverageRadiusKm: z.number().min(1).max(50).optional()
});

const staffSchema = z.object({
  teamId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  password: z.string().min(6)
});

export async function GET() {
  await connectDb();
  const teams = await RescueTeamModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ teams });
}

export async function POST(req: NextRequest) {
  const actor = await requireApiAuth(req);
  if (!actor) return unauthorized();
  await connectDb();

  const body = await req.json();
  if (body.mode === "staff") {
    if (!actor.teamId && actor.role !== "admin") return forbidden("Only team owners/admin can add staff");

    const input = staffSchema.parse(body);
    if (actor.role !== "admin" && String(actor.teamId) !== input.teamId) return forbidden();
    if (!mongoose.isValidObjectId(input.teamId)) {
      return NextResponse.json({ error: "Invalid teamId" }, { status: 400 });
    }

    const existing = await UserModel.findOne({ email: input.email.toLowerCase().trim() });
    if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

    const passwordHash = await bcrypt.hash(input.password, 10);
    const staff = await UserModel.create({
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone,
      passwordHash,
      role: "team_staff",
      teamId: new mongoose.Types.ObjectId(input.teamId),
      verifiedAt: new Date()
    });

    return NextResponse.json({ ok: true, staff: { id: String(staff._id), name: staff.name, email: staff.email } });
  }

  const input = createSchema.parse(body);
  if (!["admin", "rescue_team"].includes(actor.role)) return forbidden("Only admin or rescue team can create teams");

  const areaNames = input.areaNames.map((item) => normalizeArea(item)).filter(Boolean);
  const team = await RescueTeamModel.create({
    name: input.name.trim(),
    description: input.description.trim(),
    phone: input.phone.trim(),
    ownerUserId: actor._id,
    areaNames,
    location: input.location || { lat: null, lng: null },
    coverageRadiusKm: input.coverageRadiusKm
  });

  if (actor.role === "rescue_team") {
    actor.teamId = team._id;
    await actor.save();
  }

  return NextResponse.json({ ok: true, team });
}

export async function PATCH(req: NextRequest) {
  const actor = await requireApiAuth(req);
  if (!actor) return unauthorized();
  if (!["admin", "rescue_team"].includes(actor.role)) return forbidden();
  await connectDb();

  const input = patchSchema.parse(await req.json());
  const team = await RescueTeamModel.findById(input.teamId);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (actor.role !== "admin" && String(actor._id) !== String(team.ownerUserId)) return forbidden();

  if (typeof input.name === "string") team.name = input.name.trim();
  if (typeof input.description === "string") team.description = input.description.trim();
  if (typeof input.phone === "string") team.phone = input.phone.trim();
  if (Array.isArray(input.areaNames)) {
    team.areaNames = input.areaNames.map((item) => normalizeArea(item)).filter(Boolean);
  }
  if (input.location) team.location = input.location;
  if (typeof input.coverageRadiusKm === "number") team.coverageRadiusKm = input.coverageRadiusKm;

  await team.save();
  return NextResponse.json({ ok: true, team });
}
