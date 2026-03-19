import {
  createCreemDataFast,
  InMemoryIdempotencyStore,
} from "creem-datafast";

const cd = createCreemDataFast({
  creemApiKey: process.env.CREEM_API_KEY!,
  creemWebhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  datafastApiKey: process.env.DATAFAST_API_KEY!,
  creemServerIdx: 1, // sandbox
  debug: true,
  idempotencyStore: new InMemoryIdempotencyStore(),
});

export const POST = cd.nextWebhookHandler({
  onProcessed(result) {
    console.log("Webhook processed:", result);
  },
  onError(error) {
    console.error("Webhook error:", error);
  },
});
