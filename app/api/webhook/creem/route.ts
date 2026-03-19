import {
  createCreemDataFast,
  MemoryIdempotencyStore,
} from "creem-datafast";
import { createNextWebhookHandler } from "creem-datafast/next";

const cd = createCreemDataFast({
  creemApiKey: process.env.CREEM_API_KEY!,
  creemWebhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  datafastApiKey: process.env.DATAFAST_API_KEY!,
  testMode: true,
  idempotencyStore: new MemoryIdempotencyStore(),
});

export const POST = createNextWebhookHandler(cd, {
  onError(error) {
    console.error("Webhook error:", error);
  },
});
