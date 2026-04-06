import crypto from "crypto";

const OTP_PURPOSE_VERIFY_EMAIL = "verify-email";

function getOtpSecret() {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing OTP_SECRET (or JWT_SECRET fallback)");
  }
  return secret;
}

export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtpCode(email: string, code: string, purpose = OTP_PURPOSE_VERIFY_EMAIL) {
  const normalizedEmail = email.toLowerCase().trim();
  const payload = `${purpose}:${normalizedEmail}:${code}`;
  return crypto.createHmac("sha256", getOtpSecret()).update(payload).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}
