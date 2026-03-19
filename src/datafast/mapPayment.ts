import type { DataFastPaymentRequest } from "../core/types.js";
import type { CreemWebhookEvent } from "../creem/webhookTypes.js";

/**
 * Map a checkout.completed event to a DataFast payment request.
 *
 * CREEM payload shape: { eventType, object: { order, customer, product, metadata, ... }, id, created_at }
 */
export function mapCheckoutCompleted(
  event: CreemWebhookEvent,
): DataFastPaymentRequest {
  const obj = event.object;
  const order = obj.order;
  const customer = obj.customer;
  const metadata = obj.metadata;

  const amountCents = order?.amount ?? obj.product?.price ?? 0;
  const currency = order?.currency ?? obj.product?.currency ?? "USD";
  const transactionId = order?.id ?? obj.id;

  return {
    amount: centsToDecimal(amountCents),
    currency: currency.toUpperCase(),
    transaction_id: transactionId,
    datafast_visitor_id: extractVisitorId(metadata),
    email: customer?.email,
    name: customer?.name,
    customer_id: customer?.id,
    renewal: false,
    timestamp: order?.created_at ?? obj.created_at ?? event.created_at,
  };
}

/**
 * Map a subscription.paid event to a DataFast payment request.
 */
export function mapSubscriptionPaid(
  event: CreemWebhookEvent,
): DataFastPaymentRequest {
  const obj = event.object;
  const order = obj.order;
  const customer = obj.customer;
  const metadata = obj.metadata;

  const amountCents = order?.amount ?? obj.product?.price ?? 0;
  const currency = order?.currency ?? obj.product?.currency ?? "USD";
  const transactionId = order?.id ?? `sub_${obj.id}`;

  return {
    amount: centsToDecimal(amountCents),
    currency: currency.toUpperCase(),
    transaction_id: transactionId,
    datafast_visitor_id: extractVisitorId(metadata),
    email: customer?.email,
    name: customer?.name,
    customer_id: customer?.id,
    renewal: true,
    timestamp: order?.created_at ?? obj.current_period_start ?? obj.created_at ?? event.created_at,
  };
}

/**
 * Map any supported event to a DataFast payment request.
 */
export function mapEventToPayment(
  event: CreemWebhookEvent,
  eventType: string,
): DataFastPaymentRequest {
  switch (eventType) {
    case "checkout.completed":
      return mapCheckoutCompleted(event);
    case "subscription.paid":
      return mapSubscriptionPaid(event);
    default:
      throw new Error(`Cannot map unsupported event type: ${eventType}`);
  }
}

/** Convert CREEM amount in cents to DataFast decimal format (e.g. 4900 → 49.00) */
function centsToDecimal(cents: number): number {
  return cents / 100;
}

function extractVisitorId(
  metadata: Record<string, unknown> | undefined,
): string | undefined {
  if (!metadata) return undefined;
  const value = metadata["datafast_visitor_id"];
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
}
