import { Creem } from "creem";
import type { CreateCheckoutRequest, CheckoutEntity } from "creem/models/components";
import { resolveConfig } from "./core/config.js";
import { createLogger } from "./core/logger.js";
import type {
  CreemDataFastConfig,
  MetadataMergeStrategy,
  WebhookHandlerResult,
} from "./core/types.js";
import { createCheckoutWithAttribution } from "./checkout/createCheckout.js";
import { handleWebhook } from "./handlers/genericWebhookHandler.js";
import type { HandleWebhookInput } from "./handlers/genericWebhookHandler.js";
import { createExpressWebhookMiddleware } from "./adapters/express.js";
import type { ExpressWebhookHandlerOptions } from "./adapters/express.js";
import { createNextWebhookRouteHandler } from "./adapters/next.js";
import type { NextWebhookHandlerOptions } from "./adapters/next.js";

export interface CreateCheckoutInput {
  input: CreateCheckoutRequest;
  datafastVisitorId?: string | null;
  mergeStrategy?: MetadataMergeStrategy;
}

export interface CreemDataFastInstance {
  /** Create a CREEM checkout with DataFast attribution injected into metadata. */
  createCheckout: (options: CreateCheckoutInput) => Promise<CheckoutEntity>;
  /** Process a raw CREEM webhook, verify signature, and send payment to DataFast. */
  handleWebhook: (input: HandleWebhookInput) => Promise<WebhookHandlerResult>;
  /** Create an Express middleware for handling CREEM webhooks. */
  expressWebhookHandler: (
    options?: ExpressWebhookHandlerOptions,
  ) => ReturnType<typeof createExpressWebhookMiddleware>;
  /** Create a Next.js App Router route handler for CREEM webhooks. */
  nextWebhookHandler: (
    options?: NextWebhookHandlerOptions,
  ) => ReturnType<typeof createNextWebhookRouteHandler>;
  /** The underlying CREEM SDK client. */
  creem: Creem;
}

/**
 * Create a configured creem-datafast instance.
 *
 * @example
 * ```ts
 * import { createCreemDataFast } from 'creem-datafast';
 *
 * const cd = createCreemDataFast({
 *   creemApiKey: process.env.CREEM_API_KEY!,
 *   creemWebhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
 *   datafastApiKey: process.env.DATAFAST_API_KEY!,
 * });
 *
 * // Create a checkout with attribution
 * const checkout = await cd.createCheckout({
 *   input: { productId: 'prod_xxx' },
 *   datafastVisitorId: visitorId,
 * });
 *
 * // Handle webhooks (Express)
 * app.post('/webhook', express.raw({ type: 'application/json' }), cd.expressWebhookHandler());
 * ```
 */
export function createCreemDataFast(
  config: CreemDataFastConfig,
): CreemDataFastInstance {
  const resolved = resolveConfig(config);
  const logger = createLogger(resolved.debug);

  const creem = new Creem({
    apiKey: resolved.creemApiKey,
    serverIdx: resolved.creemServerIdx,
  });

  return {
    creem,

    async createCheckout(options: CreateCheckoutInput) {
      return createCheckoutWithAttribution({
        creem,
        input: options.input,
        datafastVisitorId: options.datafastVisitorId,
        mergeStrategy: options.mergeStrategy,
      });
    },

    async handleWebhook(input: HandleWebhookInput) {
      return handleWebhook(input, resolved, logger);
    },

    expressWebhookHandler(options?: ExpressWebhookHandlerOptions) {
      return createExpressWebhookMiddleware(resolved, logger, options);
    },

    nextWebhookHandler(options?: NextWebhookHandlerOptions) {
      return createNextWebhookRouteHandler(resolved, logger, options);
    },
  };
}

// Re-export types and utilities
export type {
  CreemDataFastConfig,
  MetadataMergeStrategy,
  WebhookHandlerResult,
  WebhookCallbacks,
  DataFastPaymentRequest,
  DataFastApiResponse,
  SupportedEventType,
  IdempotencyStore,
  ErrorContext,
} from "./core/types.js";

export {
  CreemDataFastError,
  ConfigError,
  MissingVisitorIdError,
  InvalidWebhookSignatureError,
  UnsupportedWebhookEventError,
  DataFastRequestError,
  MetadataCollisionError,
} from "./core/errors.js";

export { InMemoryIdempotencyStore } from "./core/idempotency.js";

export { attachDataFastVisitorToMetadata } from "./checkout/attachMetadata.js";

export { verifyCreemWebhookSignature } from "./creem/verifySignature.js";

export { DataFastClient } from "./datafast/client.js";

export type { HandleWebhookInput } from "./handlers/genericWebhookHandler.js";
