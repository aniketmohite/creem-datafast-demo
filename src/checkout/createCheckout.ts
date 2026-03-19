import type { Creem } from "creem";
import type { CreateCheckoutRequest, CheckoutEntity } from "creem/models/components";
import { attachDataFastVisitorToMetadata } from "./attachMetadata.js";
import type { MetadataMergeStrategy } from "../core/types.js";

export interface CreateCheckoutOptions {
  /** The CREEM SDK client instance */
  creem: Creem;
  /** Standard CREEM checkout input */
  input: CreateCheckoutRequest;
  /** DataFast visitor ID. If provided, will be injected into metadata. */
  datafastVisitorId?: string | null;
  /** How to handle an existing datafast_visitor_id in metadata. Default: "preserve" */
  mergeStrategy?: MetadataMergeStrategy;
}

/**
 * Create a CREEM checkout with DataFast visitor attribution automatically injected.
 *
 * This wraps `creem.checkouts.create()` and injects the `datafast_visitor_id`
 * into the checkout metadata. When the checkout completes, the CREEM webhook
 * will include this metadata, allowing the webhook handler to attribute the
 * payment in DataFast.
 *
 * The CREEM checkout response is returned unchanged.
 */
export async function createCheckoutWithAttribution(
  options: CreateCheckoutOptions,
): Promise<CheckoutEntity> {
  const { creem, input, datafastVisitorId, mergeStrategy } = options;

  const metadata = attachDataFastVisitorToMetadata(
    input.metadata as Record<string, unknown> | undefined,
    datafastVisitorId,
    mergeStrategy,
  );

  const checkoutInput: CreateCheckoutRequest = {
    ...input,
    metadata,
  };

  return creem.checkouts.create(checkoutInput);
}
