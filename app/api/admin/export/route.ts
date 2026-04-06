import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import AlertModel from "@/models/Alert";
import MessageModel from "@/models/Message";
import UserModel from "@/models/User";

function esc(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]) {
  const lines = [headers.map((h) => esc(h)).join(",")];
  for (const row of rows) {
    lines.push(row.map((cell) => esc(cell)).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export async function GET(req: NextRequest) {
  const actor = await requireApiAuth(req);
  if (!actor) return unauthorized();
  if (actor.role !== "admin") return forbidden();

  await connectDb();
  const kind = req.nextUrl.searchParams.get("kind") || "alerts";

  if (kind === "users") {
    const users = await UserModel.find().select("-passwordHash").sort({ createdAt: -1 }).limit(2000).lean();
    const csv = toCsv(
      ["id", "name", "email", "role", "teamId", "verifiedAt", "createdAt"],
      users.map((u) => [String(u._id), u.name, u.email, u.role, String(u.teamId || ""), String(u.verifiedAt || ""), String(u.createdAt || "")])
    );
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rescue-bird-users.csv"`
      }
    });
  }

  if (kind === "messages") {
    const messages = await MessageModel.find().sort({ createdAt: -1 }).limit(5000).lean();
    const csv = toCsv(
      ["id", "teamId", "senderId", "receiverId", "senderName", "senderRole", "body", "createdAt"],
      messages.map((m) => [
        String(m._id),
        String(m.teamId || ""),
        String(m.senderId || ""),
        String(m.receiverId || ""),
        m.senderNameSnapshot,
        m.senderRoleSnapshot,
        m.body,
        String(m.createdAt || "")
      ])
    );
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rescue-bird-messages.csv"`
      }
    });
  }

  if (kind !== "alerts") {
    return NextResponse.json({ error: "Invalid export kind. Use alerts, messages, or users." }, { status: 400 });
  }

  const alerts = await AlertModel.find().sort({ createdAt: -1 }).limit(5000).lean();
  const csv = toCsv(
    [
      "id",
      "userId",
      "area",
      "priority",
      "status",
      "assignedTeamId",
      "createdAt",
      "acceptedAt",
      "resolvedAt",
      "escalatedAt",
      "needsManualDispatch"
    ],
    alerts.map((a) => [
      String(a._id),
      String(a.userId || ""),
      a.area,
      a.priority || "",
      a.status,
      String(a.assignedTeamId || ""),
      String(a.createdAt || ""),
      String(a.acceptedAt || ""),
      String(a.resolvedAt || ""),
      String(a.escalatedAt || ""),
      String(Boolean(a.needsManualDispatch))
    ])
  );
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rescue-bird-alerts.csv"`
    }
  });
}
