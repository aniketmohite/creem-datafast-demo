export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

const SENSITIVE_KEYS = new Set([
  "creemApiKey",
  "creemWebhookSecret",
  "datafastApiKey",
  "apiKey",
  "secret",
  "authorization",
  "token",
]);

function redactSensitive(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key)) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export function createLogger(debug: boolean): Logger {
  const prefix = "[creem-datafast]";

  return {
    debug(message: string, data?: Record<string, unknown>) {
      if (debug) {
        console.debug(
          `${prefix} ${message}`,
          data ? redactSensitive(data) : "",
        );
      }
    },
    info(message: string, data?: Record<string, unknown>) {
      console.info(`${prefix} ${message}`, data ? redactSensitive(data) : "");
    },
    warn(message: string, data?: Record<string, unknown>) {
      console.warn(`${prefix} ${message}`, data ? redactSensitive(data) : "");
    },
    error(message: string, data?: Record<string, unknown>) {
      console.error(`${prefix} ${message}`, data ? redactSensitive(data) : "");
    },
  };
}
