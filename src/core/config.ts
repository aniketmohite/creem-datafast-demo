import { ConfigError } from "./errors.js";
import type { CreemDataFastConfig } from "./types.js";

const DATAFAST_DEFAULT_BASE_URL = "https://datafa.st";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface ResolvedConfig extends Required<Pick<CreemDataFastConfig,
  "creemApiKey" | "creemWebhookSecret" | "datafastApiKey"
>> {
  creemServerIdx: number;
  datafastApiBaseUrl: string;
  debug: boolean;
  requestTimeoutMs: number;
  onError?: CreemDataFastConfig["onError"];
  idempotencyStore?: CreemDataFastConfig["idempotencyStore"];
  fetch: typeof globalThis.fetch;
  requireVisitorId: boolean;
}

export function resolveConfig(config: CreemDataFastConfig): ResolvedConfig {
  if (!config.creemApiKey) {
    throw new ConfigError("creemApiKey is required");
  }
  if (!config.creemWebhookSecret) {
    throw new ConfigError("creemWebhookSecret is required");
  }
  if (!config.datafastApiKey) {
    throw new ConfigError("datafastApiKey is required");
  }

  return {
    creemApiKey: config.creemApiKey,
    creemServerIdx: config.creemServerIdx ?? 0,
    creemWebhookSecret: config.creemWebhookSecret,
    datafastApiKey: config.datafastApiKey,
    datafastApiBaseUrl: config.datafastApiBaseUrl ?? DATAFAST_DEFAULT_BASE_URL,
    debug: config.debug ?? false,
    requestTimeoutMs: config.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS,
    onError: config.onError,
    idempotencyStore: config.idempotencyStore,
    fetch: config.fetch ?? globalThis.fetch,
    requireVisitorId: config.requireVisitorId ?? false,
  };
}
