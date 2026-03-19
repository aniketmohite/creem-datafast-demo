import type { ResolvedConfig } from "../core/config.js";
import { InvalidWebhookSignatureError } from "../core/errors.js";
import type { Logger } from "../core/logger.js";
import type { WebhookCallbacks } from "../core/types.js";
import { handleWebhook } from "../handlers/genericWebhookHandler.js";

export interface NextWebhookHandlerOptions extends WebhookCallbacks {}

/**
 * Create a Next.js App Router route handler for CREEM webhooks.
 *
 * @example
 * ```ts
 * // app/api/webhook/creem/route.ts
 * import { createCreemDataFast } from 'creem-datafast';
 *
 * const cd = createCreemDataFast({ ... });
 * export const POST = cd.nextWebhookHandler();
 * ```
 */
export function createNextWebhookRouteHandler(
  config: ResolvedConfig,
  logger: Logger,
  options?: NextWebhookHandlerOptions,
) {
  return async (request: Request): Promise<Response> => {
    try {
      const rawBody = await request.text();

      const result = await handleWebhook(
        { rawBody, headers: request.headers },
        config,
        logger,
      );

      await options?.onProcessed?.(result);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const err =
        error instanceof Error ? error : new Error(String(error));
      logger.error("Webhook processing failed", {
        error: err.message,
      });
      await options?.onError?.(err);

      return new Response(
        JSON.stringify({ error: "Internal webhook processing error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  };
}
