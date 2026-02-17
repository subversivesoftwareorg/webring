/**
 * Normalize a URL for deduplication: lowercase host, strip trailing slash,
 * remove default ports, sort query params.
 */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hostname = u.hostname.toLowerCase();
    // Remove default ports
    if (
      (u.protocol === "http:" && u.port === "80") ||
      (u.protocol === "https:" && u.port === "443")
    ) {
      u.port = "";
    }
    // Sort query params for consistent comparison
    u.searchParams.sort();
    // Strip trailing slash from pathname
    if (u.pathname.endsWith("/") && u.pathname !== "/") {
      u.pathname = u.pathname.slice(0, -1);
    }
    // Remove hash
    u.hash = "";
    return u.toString();
  } catch {
    return raw;
  }
}
