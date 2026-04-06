import assert from "node:assert/strict";
import test from "node:test";
import { generateOtpCode, hashOtpCode, safeEqualHex } from "@/lib/otp";

test("generateOtpCode returns 6-digit string", () => {
  const code = generateOtpCode();
  assert.equal(/^\d{6}$/.test(code), true);
});

test("hashOtpCode is deterministic for same input", () => {
  process.env.OTP_SECRET = "test-secret-otp";
  const email = "ops@example.com";
  const code = "123456";
  const h1 = hashOtpCode(email, code);
  const h2 = hashOtpCode(email, code);
  assert.equal(h1, h2);
});

test("hashOtpCode changes if OTP changes", () => {
  process.env.OTP_SECRET = "test-secret-otp";
  const email = "ops@example.com";
  const h1 = hashOtpCode(email, "123456");
  const h2 = hashOtpCode(email, "123457");
  assert.notEqual(h1, h2);
});

test("safeEqualHex compares valid equal and unequal hashes", () => {
  process.env.OTP_SECRET = "test-secret-otp";
  const email = "ops@example.com";
  const hash = hashOtpCode(email, "123456");
  const other = hashOtpCode(email, "654321");
  assert.equal(safeEqualHex(hash, hash), true);
  assert.equal(safeEqualHex(hash, other), false);
});
