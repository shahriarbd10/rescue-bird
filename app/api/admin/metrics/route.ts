import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireApiAuth, unauthorized } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import AlertModel from "@/models/Alert";
import MessageModel from "@/models/Message";
import RescueTeamModel from "@/models/RescueTeam";
import UserModel from "@/models/User";

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export async function GET(req: NextRequest) {
  const actor = await requireApiAuth(req);
  if (!actor) return unauthorized();
  if (actor.role !== "admin") return forbidden();

  await connectDb();
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalTeams, totalMessages, alerts7d, alerts30d] = await Promise.all([
    UserModel.countDocuments(),
    RescueTeamModel.countDocuments(),
    MessageModel.countDocuments(),
    AlertModel.find({ createdAt: { $gte: sevenDaysAgo } })
      .select("createdAt acceptedAt resolvedAt priority status")
      .lean(),
    AlertModel.find({ createdAt: { $gte: thirtyDaysAgo } })
      .select("priority status")
      .lean()
  ]);

  const statusCounts = alerts30d.reduce(
    (acc, alert) => {
      acc[alert.status] = (acc[alert.status] || 0) + 1;
      return acc;
    },
    { open: 0, accepted: 0, resolved: 0 } as Record<string, number>
  );

  const priorityCounts = alerts30d.reduce(
    (acc, alert) => {
      const key = alert.priority || "high";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>
  );

  const acceptMinutes = alerts7d
    .filter((alert) => alert.acceptedAt)
    .map((alert) => (new Date(String(alert.acceptedAt)).getTime() - new Date(String(alert.createdAt)).getTime()) / 60000)
    .filter((value) => Number.isFinite(value) && value >= 0);

  const resolveMinutes = alerts7d
    .filter((alert) => alert.resolvedAt)
    .map((alert) => (new Date(String(alert.resolvedAt)).getTime() - new Date(String(alert.createdAt)).getTime()) / 60000)
    .filter((value) => Number.isFinite(value) && value >= 0);

  const hotspotCounts = await AlertModel.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $toLower: "$area" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return NextResponse.json({
    totals: {
      users: totalUsers,
      teams: totalTeams,
      messages: totalMessages,
      alerts30d: alerts30d.length
    },
    alerts: {
      statusCounts,
      priorityCounts,
      avgAcceptMinutes7d: Number(avg(acceptMinutes).toFixed(2)),
      avgResolveMinutes7d: Number(avg(resolveMinutes).toFixed(2)),
      areaHotspots30d: hotspotCounts.map((h) => ({ area: String(h._id || "unknown"), count: Number(h.count || 0) }))
    }
  });
}
