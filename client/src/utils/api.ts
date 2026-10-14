/**
 * Constructs an API endpoint URL using the configured VITE_API_BASE_URL if set,
 * or falls back to relative paths (e.g. '/api/inquiries') to support Vite's local dev/preview proxy.
 *
 * Requirements:
 * - When VITE_API_BASE_URL is configured, requests use that base URL.
 * - When unset or empty, requests continue using relative URLs, preserving local Vite proxy behavior.
 * - Trailing slashes in the configured base URL are handled cleanly without double slashes.
 * - Path leading slashes are normalized automatically.
 *
 * @param path - The API endpoint path (e.g. '/api/inquiries' or 'api/inquiries')
 * @param baseUrl - Optional base URL override (defaults to import.meta.env.VITE_API_BASE_URL)
 */
export function getApiUrl(
  path: string,
  baseUrl: string | undefined = (import.meta as any)?.env?.VITE_API_BASE_URL
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!baseUrl || typeof baseUrl !== 'string') {
    return normalizedPath;
  }

  const trimmedBase = baseUrl.trim();
  if (!trimmedBase) {
    return normalizedPath;
  }

  // Remove any trailing slashes from the configured base URL
  const cleanBase = trimmedBase.replace(/\/+$/, '');
  return `${cleanBase}${normalizedPath}`;
}
