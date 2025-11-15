export function normalizeToken(token?: string | null): string {
  if (!token) return '';
  return token.replace(/^Bearer\s+/i, '').trim();
}
