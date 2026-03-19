import { createHmac, timingSafeEqual } from "node:crypto";
import { InvalidWebhookSignatureError } from "../core/errors.js";

const SIGNATURE_HEADER = "creem-signature";

/**
 * Verify a CREEM webhook signature using HMAC SHA256.
 *
 * The signature is computed over the raw request body using the webhook secret.
 * Always use the raw body string, never a re-serialized JSON object.
 *
 * @param rawBody - The raw request body as a string
 * @param signature - The value of the `creem-signature` header
 * @param secret - The CREEM webhook secret
 * @returns true if valid
 * @throws InvalidWebhookSignatureError if the signature is invalid or missing
 */
export function verifyCreemWebhookSignature(
  rawBody: string,
  signature: string | undefined | null,
  secret: string,
): true {
  if (!signature) {
    throw new InvalidWebhookSignatureError();
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    throw new InvalidWebhookSignatureError();
  }

  return true;
}

/**
 * Extract the CREEM signature header value from a headers object.
 * Handles both plain objects and Headers instances.
 */
export function extractSignatureHeader(
  headers: Record<string, string | string[] | undefined> | Headers,
): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(SIGNATURE_HEADER) ?? undefined;
  }
  const value = headers[SIGNATURE_HEADER];
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}
