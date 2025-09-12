import { nanoid } from "nanoid";

export function generateInviteToken(): string {
  return nanoid(32);
}

export function ttlFromEnv(): number {
  const n = Number(process.env.INVITE_TOKEN_TTL_MINUTES || "30");
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export function getTokenExpiryDate(): Date {
  const ttlMinutes = ttlFromEnv();
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + ttlMinutes);
  return expiryDate;
}

export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}