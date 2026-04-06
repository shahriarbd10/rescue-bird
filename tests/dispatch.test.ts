import assert from "node:assert/strict";
import test from "node:test";
import { computeNextEscalationAt, getEscalationMinutes } from "@/lib/dispatch";

test("getEscalationMinutes uses expected priority windows", () => {
  assert.equal(getEscalationMinutes("critical"), 3);
  assert.equal(getEscalationMinutes("high"), 6);
  assert.equal(getEscalationMinutes("medium"), 10);
  assert.equal(getEscalationMinutes("low"), 15);
});

test("computeNextEscalationAt adds correct minutes", () => {
  const base = new Date("2026-01-01T00:00:00.000Z");
  const next = computeNextEscalationAt("critical", base);
  assert.equal(next.toISOString(), "2026-01-01T00:03:00.000Z");
});
