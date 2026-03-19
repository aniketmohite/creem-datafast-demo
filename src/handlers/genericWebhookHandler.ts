import type { ResolvedConfig } from "../core/config.js";
import {
  MissingVisitorIdError,
  UnsupportedWebhookEventError,
} from "../core/errors.js";
import type { Logger } from "../core/logger.js";
import type { WebhookHandlerResult } from "../core/types.js";
import {
  verifyCreemWebhookSignature,
  extractSignatureHeader,
} from "../creem/verifySignature.js";
import { parseWebhookEvent } from "../creem/parseEvent.js";
import { mapEventToPayment } from "../datafast/mapPayment.js";
import { DataFastClient } from "../datafast/client.js";

export interface HandleWebhookInput {
  rawBody: string;
  headers: Record<string, string | string[] | undefined> | Headers;
}

/**
 * Generic webhook handler that processes CREEM webhook events and sends
 * payment data to DataFast.
 *
 * This is framework-agnostic. The Express and Next.js adapters call this
 * internally after extracting the raw body and headers.
 */
export async function handleWebhook(
  input: HandleWebhookInput,
  config: ResolvedConfig,
  logger: Logger,
): Promise<WebhookHandlerResult> {
  const { rawBody, headers } = input;

  // 1. Verify signature
  const signature = extractSignatureHeader(headers);
  verifyCreemWebhookSignature(rawBody, signature, config.creemWebhookSecret);
  logger.debug("Webhook signature verified");

  // 2. Parse event — unsupported events are silently acknowledged
  let parsed;
  try {
    parsed = parseWebhookEvent(rawBody);
  } catch (error) {
    if (error instanceof UnsupportedWebhookEventError) {
      logger.debug("Ignoring unsupported event type", {
        eventType: error.eventType,
      });
      return {
        ok: true,
        eventType: error.eventType,
        transactionId: "",
        skipped: true,
        skipReason: "unsupported_event",
      };
    }
    throw error;
  }

  const { event, eventType } = parsed;
  logger.debug("Parsed webhook event", {
    eventType,
    eventId: event.id,
    objectId: event.object?.id,
  });

  // 3. Check idempotency
  const dedupeKey = event.id;
  if (config.idempotencyStore && dedupeKey) {
    const seen = await config.idempotencyStore.has(dedupeKey);
    if (seen) {
      logger.debug("Duplicate webhook event, skipping", {
        eventId: dedupeKey,
      });
      return {
        ok: true,
        eventType,
        transactionId: dedupeKey,
        skipped: true,
        skipReason: "duplicate",
      };
    }
  }

  // 4. Map to DataFast payment
  const payment = mapEventToPayment(event, eventType);
  logger.debug("Mapped payment", {
    transactionId: payment.transaction_id,
    amount: payment.amount,
    currency: payment.currency,
    hasVisitorId: !!payment.datafast_visitor_id,
  });

  // 5. Check visitor ID requirement
  if (!payment.datafast_visitor_id) {
    if (config.requireVisitorId) {
      throw new MissingVisitorIdError(payment.transaction_id);
    }
    logger.warn(
      "datafast_visitor_id not found in webhook metadata. Payment will be sent without attribution.",
      { transactionId: payment.transaction_id },
    );
  }

  // 6. Send to DataFast
  const datafastClient = new DataFastClient({
    apiKey: config.datafastApiKey,
    baseUrl: config.datafastApiBaseUrl,
    timeoutMs: config.requestTimeoutMs,
    fetch: config.fetch,
  });

  const datafastResponse = await datafastClient.sendPayment(payment);
  logger.debug("Sent payment to DataFast", {
    transactionId: payment.transaction_id,
    status: datafastResponse.status,
  });

  // 7. Record in idempotency store
  if (config.idempotencyStore && dedupeKey) {
    await config.idempotencyStore.set(dedupeKey, {
      processedAt: new Date().toISOString(),
      eventType,
    });
  }

  return {
    ok: true,
    eventType,
    transactionId: payment.transaction_id,
    datafastResponse,
  };
}
