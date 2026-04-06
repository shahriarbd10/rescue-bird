import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit } from "@/lib/rate-limit";

test("checkRateLimit allows up to configured limit then blocks", () => {
  const key = `test:ratelimit:${Date.now()}`;
  const config = { limit: 2, windowMs: 5000 };

  const first = checkRateLimit(key, config);
  const second = checkRateLimit(key, config);
  const third = checkRateLimit(key, config);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(third.ok, false);
  assert.equal(third.remaining, 0);
  assert.equal(third.retryAfterSeconds > 0, true);
});

test("checkRateLimit resets after window passes", async () => {
  const key = `test:ratelimit:reset:${Date.now()}`;
  const config = { limit: 1, windowMs: 80 };

  const first = checkRateLimit(key, config);
  assert.equal(first.ok, true);

  const blocked = checkRateLimit(key, config);
  assert.equal(blocked.ok, false);

  await new Promise((resolve) => setTimeout(resolve, 120));
  const afterWindow = checkRateLimit(key, config);
  assert.equal(afterWindow.ok, true);
});
