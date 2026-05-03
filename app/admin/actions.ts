"use server";

import crypto from "crypto";
import { headers } from "next/headers";

// Simple in-memory rate limiting (best-effort for single-instance/dev)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export async function verifyAdminPassword(password: string) {
  const correctPassword = process.env.ADMIN_PAGE_PASSWORD;
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown";

  // 1. Missing Environment Variable Check
  if (!correctPassword || correctPassword.length === 0) {
    console.error("ADMIN_PAGE_PASSWORD is not set in environment variables.");
    return false;
  }

  // 2. Simple Rate Limiting
  const now = Date.now();
  const attempts = failedAttempts.get(ip);

  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const timeSinceLast = now - attempts.lastAttempt;
    if (timeSinceLast < LOCKOUT_TIME) {
      console.warn(`Blocked attempt from IP: ${ip}. Locked out.`);
      return false;
    } else {
      // Lockout expired, reset
      failedAttempts.delete(ip);
    }
  }

  // 3. Timing-Safe Comparison
  // We hash both strings to SHA-256 to ensure they have the same length before comparison
  const hashedCorrect = crypto.createHash("sha256").update(correctPassword).digest();
  const hashedInput = crypto.createHash("sha256").update(password || "").digest();

  const isValid = crypto.timingSafeEqual(hashedCorrect, hashedInput);

  // Update rate limiting state
  if (!isValid) {
    const current = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    failedAttempts.set(ip, {
      count: current.count + 1,
      lastAttempt: now
    });
  } else {
    // Reset on successful login
    failedAttempts.delete(ip);
  }

  return isValid;
}
