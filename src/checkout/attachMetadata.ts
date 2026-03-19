import { MetadataCollisionError } from "../core/errors.js";
import type { MetadataMergeStrategy } from "../core/types.js";

const VISITOR_ID_KEY = "datafast_visitor_id";

/**
 * Attach a DataFast visitor ID to checkout metadata.
 *
 * The visitor ID is stored under the key `datafast_visitor_id` in the
 * metadata object. This is the key that the webhook handler looks for
 * when mapping events to DataFast payments.
 *
 * @param metadata - Existing metadata object (will not be mutated)
 * @param visitorId - The DataFast visitor ID to attach
 * @param mergeStrategy - How to handle existing visitor ID. Default: "preserve"
 * @returns New metadata object with visitor ID attached
 */
export function attachDataFastVisitorToMetadata(
  metadata: Record<string, unknown> | undefined,
  visitorId: string | null | undefined,
  mergeStrategy: MetadataMergeStrategy = "preserve",
): Record<string, unknown> {
  const result = { ...(metadata ?? {}) };

  if (!visitorId) {
    return result;
  }

  const existing = result[VISITOR_ID_KEY];
  if (existing !== undefined && existing !== null) {
    switch (mergeStrategy) {
      case "preserve":
        return result;
      case "overwrite":
        result[VISITOR_ID_KEY] = visitorId;
        return result;
      case "error":
        throw new MetadataCollisionError();
    }
  }

  result[VISITOR_ID_KEY] = visitorId;
  return result;
}
