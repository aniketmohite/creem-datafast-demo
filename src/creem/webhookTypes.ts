/**
 * CREEM webhook event.
 *
 * Real CREEM webhooks are flat with 4 top-level keys:
 *   { eventType, object, id, created_at }
 *
 * - `eventType`: e.g. "checkout.completed", "subscription.paid"
 * - `object`: the full entity (checkout, subscription, etc.)
 * - `id`: the webhook event ID (e.g. "evt_xxx")
 * - `created_at`: when the event was created
 */
export interface CreemWebhookEvent {
  id: string;
  eventType: string;
  object: CreemWebhookObject;
  created_at: string;
}

/**
 * The `object` field in a CREEM webhook contains the full entity.
 * We use a flexible type to handle checkout and subscription objects.
 */
export interface CreemWebhookObject {
  id: string;
  status?: string;
  order?: CreemOrderData;
  customer?: CreemCustomerData;
  product?: CreemProductData;
  subscription?: CreemSubscriptionData;
  metadata?: Record<string, unknown>;
  created_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  [key: string]: unknown;
}

export interface CreemOrderData {
  id: string;
  amount: number;
  currency: string;
  status?: string;
  created_at?: string;
}

export interface CreemCustomerData {
  id: string;
  email?: string;
  name?: string;
}

export interface CreemProductData {
  id: string;
  name?: string;
  price?: number;
  currency?: string;
}

export interface CreemSubscriptionData {
  id: string;
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
}
