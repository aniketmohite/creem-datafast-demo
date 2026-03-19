const COOKIE_NAME = "datafast_visitor_id";

/**
 * Read the DataFast visitor ID from document.cookie in the browser.
 * Returns null if the cookie is not found or if running outside a browser.
 */
export function getDataFastVisitorId(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  try {
    const cookies = document.cookie;
    if (!cookies) return null;

    const pairs = cookies.split(";");
    for (const pair of pairs) {
      const eqIndex = pair.indexOf("=");
      if (eqIndex === -1) continue;
      const name = pair.substring(0, eqIndex).trim();
      const value = pair.substring(eqIndex + 1).trim();
      if (name === COOKIE_NAME) {
        return decodeURIComponent(value) || null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Build checkout metadata that includes the DataFast visitor ID.
 * Merges with any existing metadata without overwriting unrelated keys.
 * If the cookie is not found, returns the existing metadata unchanged.
 */
export function buildCheckoutAttributionMetadata(
  existingMetadata?: Record<string, unknown>,
): Record<string, unknown> {
  const visitorId = getDataFastVisitorId();
  const metadata = { ...(existingMetadata ?? {}) };

  if (visitorId && !metadata[COOKIE_NAME]) {
    metadata[COOKIE_NAME] = visitorId;
  }

  return metadata;
}
