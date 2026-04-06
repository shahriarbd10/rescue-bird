import AlertModel from "@/models/Alert";

export type AlertPriority = "low" | "medium" | "high" | "critical";

const ESCALATION_MINUTES_BY_PRIORITY: Record<AlertPriority, number> = {
  low: 15,
  medium: 10,
  high: 6,
  critical: 3
};

export function getEscalationMinutes(priority: AlertPriority) {
  return ESCALATION_MINUTES_BY_PRIORITY[priority] ?? ESCALATION_MINUTES_BY_PRIORITY.high;
}

export function computeNextEscalationAt(priority: AlertPriority, from = new Date()) {
  return new Date(from.getTime() + getEscalationMinutes(priority) * 60 * 1000);
}

export async function runEscalationCycle() {
  const now = new Date();
  const dueAlerts = await AlertModel.find({
    status: "open",
    nextEscalationAt: { $ne: null, $lte: now }
  }).limit(50);

  for (const alert of dueAlerts) {
    const candidates = Array.isArray(alert.escalationCandidates) ? alert.escalationCandidates : [];
    const currentIndex = typeof alert.escalationIndex === "number" ? alert.escalationIndex : 0;
    const nextIndex = currentIndex + 1;

    if (nextIndex >= candidates.length) {
      alert.needsManualDispatch = true;
      alert.nextEscalationAt = null;
      await alert.save();
      continue;
    }

    alert.assignedTeamId = candidates[nextIndex] || null;
    alert.escalationIndex = nextIndex;
    alert.escalatedAt = now;
    alert.nextEscalationAt = computeNextEscalationAt((alert.priority || "high") as AlertPriority, now);
    await alert.save();
  }
}
