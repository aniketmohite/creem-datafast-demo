import type { Request, Response, NextFunction } from "express";
import type { ResolvedConfig } from "../core/config.js";
import { InvalidWebhookSignatureError } from "../core/errors.js";
import type { Logger } from "../core/logger.js";
import type { WebhookCallbacks } from "../core/types.js";
import { handleWebhook } from "../handlers/genericWebhookHandler.js";

export interface ExpressWebhookHandlerOptions extends WebhookCallbacks {}

/**
 * Create an Express middleware that handles CREEM webhook events.
 *
 * Important: The request body must be the raw string/buffer. Use
 * `express.raw({ type: 'application/json' })` on this route, NOT
 * `express.json()`.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createCreemDataFast } from 'creem-datafast';
 *
 * const app = express();
 * const cd = createCreemDataFast({ ... });
 *
 * app.post(
 *   '/webhook/creem',
 *   express.raw({ type: 'application/json' }),
 *   cd.expressWebhookHandler()
 * );
 * ```
 */
export function createExpressWebhookMiddleware(
  config: ResolvedConfig,
  logger: Logger,
  options?: ExpressWebhookHandlerOptions,
) {
  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      const rawBody =
        typeof req.body === "string"
          ? req.body
          : Buffer.isBuffer(req.body)
            ? req.body.toString("utf8")
            : JSON.stringify(req.body);

      const result = await handleWebhook(
        {
          rawBody,
          headers: req.headers as Record<
            string,
            string | string[] | undefined
          >,
        },
        config,
        logger,
      );

      await options?.onProcessed?.(result);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        res.status(400).json({ error: error.message });
        return;
      }

      const err =
        error instanceof Error ? error : new Error(String(error));
      logger.error("Webhook processing failed", {
        error: err.message,
      });
      await options?.onError?.(err);
      res.status(500).json({ error: "Internal webhook processing error" });
    }
  };
}
