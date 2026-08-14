const LOGIN_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeLoginEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

export function isValidLoginEmail(email: string): boolean {
  const n = normalizeLoginEmail(email);
  return n.length >= 5 && n.length <= 100 && LOGIN_EMAIL_RE.test(n);
}
