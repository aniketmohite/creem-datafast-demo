import { UnsupportedWebhookEventError } from "../core/errors.js";
import type { SupportedEventType } from "../core/types.js";
import type { CreemWebhookEvent } from "./webhookTypes.js";

const SUPPORTED_EVENTS = new Set<string>([
  "checkout.completed",
  "subscription.paid",
]);

/**
 * Parse and validate a CREEM webhook event from JSON string.
 *
 * CREEM sends flat payloads: { eventType, object, id, created_at }
 *
 * @param rawBody - Raw JSON string from the webhook request
 * @returns Parsed webhook event and its type
 * @throws UnsupportedWebhookEventError if the event type is not supported
 * @throws SyntaxError if the body is not valid JSON
 */
export function parseWebhookEvent(rawBody: string): {
  event: CreemWebhookEvent;
  eventType: SupportedEventType;
} {
  const parsed = JSON.parse(rawBody) as CreemWebhookEvent;

  const eventType = parsed.eventType;
  if (!eventType || !SUPPORTED_EVENTS.has(eventType)) {
    throw new UnsupportedWebhookEventError(
      eventType ?? `undefined (payload keys: ${Object.keys(parsed).join(", ")})`,
    );
  }

  return {
    event: parsed,
    eventType: eventType as SupportedEventType,
  };
}
