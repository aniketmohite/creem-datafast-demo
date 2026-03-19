/**
 * Configuration for the creem-datafast integration.
 */
export interface CreemDataFastConfig {
  /** CREEM API key */
  creemApiKey: string;
  /** CREEM server index: 0 = production, 1 = sandbox/test */
  creemServerIdx?: number;
  /** CREEM webhook secret for signature verification */
  creemWebhookSecret: string;
  /** DataFast API key (Bearer token) */
  datafastApiKey: string;
  /** DataFast API base URL. Defaults to https://datafa.st */
  datafastApiBaseUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Request timeout in milliseconds. Defaults to 10000 */
  requestTimeoutMs?: number;
  /** Error callback for non-critical errors */
  onError?: (error: Error, context: ErrorContext) => void;
  /** Idempotency store for webhook deduplication */
  idempotencyStore?: IdempotencyStore;
  /** Custom fetch implementation for testing or edge runtimes */
  fetch?: typeof globalThis.fetch;
  /** If true, skip sending to DataFast when visitor ID is missing. Defaults to false. */
  requireVisitorId?: boolean;
}

export interface ErrorContext {
  operation: string;
  eventType?: string;
  transactionId?: string;
}

/**
 * Idempotency store interface for webhook deduplication.
 * Implement with Redis or similar for production use.
 */
export interface IdempotencyStore {
  has(key: string): Promise<boolean>;
  set(
    key: string,
    value: { processedAt: string; eventType: string },
  ): Promise<void>;
}

/**
 * Merge strategy for metadata when datafast_visitor_id already exists.
 * - "preserve": keep the existing value (default)
 * - "overwrite": replace with the new value
 * - "error": throw MetadataCollisionError
 */
export type MetadataMergeStrategy = "preserve" | "overwrite" | "error";

/**
 * DataFast payment request body.
 */
export interface DataFastPaymentRequest {
  amount: number;
  currency: string;
  transaction_id: string;
  datafast_visitor_id?: string;
  email?: string;
  name?: string;
  customer_id?: string;
  renewal?: boolean;
  refunded?: boolean;
  timestamp?: string;
}

/**
 * Result from processing a webhook event.
 */
export interface WebhookHandlerResult {
  ok: boolean;
  eventType: string;
  transactionId: string;
  skipped?: boolean;
  skipReason?: string;
  datafastResponse?: DataFastApiResponse;
  error?: string;
}

export interface DataFastApiResponse {
  status: number;
  body: unknown;
}

/**
 * Supported CREEM webhook event types.
 */
export type SupportedEventType = "checkout.completed" | "subscription.paid";

/**
 * Callback hooks for framework adapters.
 */
export interface WebhookCallbacks {
  onProcessed?: (result: WebhookHandlerResult) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}
