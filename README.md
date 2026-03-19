# creem-datafast

Connect [CREEM](https://creem.io) payments with [DataFast](https://datafa.st) revenue attribution. Automatically track which traffic sources drive your revenue.

## What problem this solves

When using CREEM for payments and DataFast for analytics, you need to connect the two: attribute each payment to the visitor who made it. This package handles the full pipeline:

1. **Client-side**: Read the `datafast_visitor_id` cookie set by the DataFast tracking script
2. **Checkout**: Inject the visitor ID into CREEM checkout metadata
3. **Webhook**: Verify CREEM webhook signatures, extract payment data, and send it to DataFast's payment tracking API

Without this, you'd write the same glue code in every project.

## Install

```bash
npm install creem-datafast creem
```

`creem` is a peer dependency — you need it installed alongside this package.

## Configuration

```ts
import { createCreemDataFast, InMemoryIdempotencyStore } from 'creem-datafast';

const cd = createCreemDataFast({
  // Required
  creemApiKey: process.env.CREEM_API_KEY!,
  creemWebhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  datafastApiKey: process.env.DATAFAST_API_KEY!,

  // Optional
  creemServerIdx: 0,                              // 0 = production, 1 = sandbox
  datafastApiBaseUrl: 'https://datafa.st',         // default
  debug: false,                                    // enable debug logging
  requestTimeoutMs: 10_000,                        // DataFast API timeout
  requireVisitorId: false,                         // throw if visitor ID missing
  idempotencyStore: new InMemoryIdempotencyStore(), // dedupe webhooks
  onError: (err, ctx) => console.error(err, ctx),  // error callback
});
```

## Client-side cookie helper

In the browser, read the DataFast visitor ID cookie and include it when creating a checkout:

```ts
// Import the browser-specific bundle (no Node.js dependencies)
import { getDataFastVisitorId, buildCheckoutAttributionMetadata } from 'creem-datafast/browser';

// Read the cookie
const visitorId = getDataFastVisitorId();
// => "3cff4252-fa96-4gec-8b1b-bs695e763b65" or null

// Or build metadata that includes it automatically
const metadata = buildCheckoutAttributionMetadata({ campaign: 'spring' });
// => { campaign: 'spring', datafast_visitor_id: '3cff4252-...' }
```

Send the `visitorId` to your server when creating a checkout.

## Checkout example

```ts
const checkout = await cd.createCheckout({
  input: {
    productId: 'prod_xxx',
    customer: { email: 'customer@example.com' },
    successUrl: 'https://yoursite.com/success',
    metadata: { campaign: 'spring' },
  },
  datafastVisitorId: visitorId, // from client-side cookie
});

// checkout.checkoutUrl => redirect the customer here
```

The visitor ID is stored in `metadata.datafast_visitor_id`. Your existing metadata keys are preserved.

### Merge strategies

If `datafast_visitor_id` already exists in metadata:

| Strategy | Behavior |
|----------|----------|
| `"preserve"` (default) | Keep the existing value |
| `"overwrite"` | Replace with the new value |
| `"error"` | Throw `MetadataCollisionError` |

```ts
const checkout = await cd.createCheckout({
  input: { productId: 'prod_xxx', metadata: { datafast_visitor_id: 'old' } },
  datafastVisitorId: 'new',
  mergeStrategy: 'overwrite', // "new" wins
});
```

## Express example

```ts
import express from 'express';
import { createCreemDataFast } from 'creem-datafast';

const app = express();
const cd = createCreemDataFast({ /* config */ });

// Important: use express.raw() on the webhook route, NOT express.json()
app.post(
  '/webhook/creem',
  express.raw({ type: 'application/json' }),
  cd.expressWebhookHandler({
    onProcessed(result) {
      console.log('Payment tracked:', result.transactionId);
    },
    onError(error) {
      console.error('Webhook failed:', error);
    },
  })
);
```

## Next.js example

```ts
// app/api/webhook/creem/route.ts
import { createCreemDataFast } from 'creem-datafast';

const cd = createCreemDataFast({ /* config */ });

export const POST = cd.nextWebhookHandler({
  onProcessed(result) {
    console.log('Payment tracked:', result.transactionId);
  },
});
```

## Webhook signature verification

CREEM signs webhooks with HMAC SHA256 using the `creem-signature` header. This package:

1. Reads the raw request body (not re-serialized JSON)
2. Computes HMAC SHA256 with your webhook secret
3. Compares using timing-safe comparison
4. Rejects with `InvalidWebhookSignatureError` on mismatch

**Critical**: For Express, use `express.raw({ type: 'application/json' })` on the webhook route so the raw body is preserved. Using `express.json()` will re-serialize the body and break signature verification.

You can also use the verifier standalone:

```ts
import { verifyCreemWebhookSignature } from 'creem-datafast';

verifyCreemWebhookSignature(rawBody, signatureHeader, webhookSecret);
// throws InvalidWebhookSignatureError if invalid
```

## Event support matrix

| CREEM Event | DataFast Field Mapping |
|---|---|
| `checkout.completed` | `amount`, `currency`, `transaction_id` (order ID), `email`, `name`, `customer_id`, `datafast_visitor_id` (from metadata), `renewal: false` |
| `subscription.paid` | Same fields, `renewal: true`, timestamp from period start |

## Idempotency

CREEM retries webhook deliveries. To prevent duplicate DataFast payments, use an idempotency store:

```ts
import { createCreemDataFast, InMemoryIdempotencyStore } from 'creem-datafast';

// Development: in-memory (resets on restart)
const cd = createCreemDataFast({
  // ...
  idempotencyStore: new InMemoryIdempotencyStore(),
});
```

For production, implement the `IdempotencyStore` interface with Redis or a database:

```ts
import type { IdempotencyStore } from 'creem-datafast';

class RedisIdempotencyStore implements IdempotencyStore {
  async has(key: string): Promise<boolean> {
    return !!(await redis.get(`webhook:${key}`));
  }
  async set(key: string, value: { processedAt: string; eventType: string }): Promise<void> {
    await redis.set(`webhook:${key}`, JSON.stringify(value), 'EX', 86400 * 7);
  }
}
```

Dedupe keys are based on the webhook event ID.

## Troubleshooting

**Signature verification fails**
- Ensure you're using `express.raw()` not `express.json()` on the webhook route
- Verify your webhook secret matches what's configured in CREEM
- Check that no middleware is modifying the request body before the webhook handler

**Missing visitor ID warnings**
- Ensure the DataFast tracking script is loaded on your site
- Check that the `datafast_visitor_id` cookie exists before creating the checkout
- The cookie is set by DataFast's client-side script, not by this package

**Duplicate payments in DataFast**
- Enable the idempotency store
- Use a durable store (Redis) in production — the in-memory store resets on restart

## Security notes

- Webhook signatures are verified using timing-safe comparison
- Secrets are never logged, even in debug mode
- Raw bodies are used for verification, never re-serialized JSON
- The package validates all required config at initialization time
- The DataFast API key is sent as a Bearer token over HTTPS

## Error types

| Error | When |
|---|---|
| `ConfigError` | Missing required config fields |
| `InvalidWebhookSignatureError` | Bad or missing webhook signature |
| `UnsupportedWebhookEventError` | Event type not in supported set |
| `MissingVisitorIdError` | No visitor ID and `requireVisitorId: true` |
| `MetadataCollisionError` | Visitor ID exists and merge strategy is `"error"` |
| `DataFastRequestError` | DataFast API returns non-2xx (includes `.status` and `.responseBody`) |

## Package limitations

- Only supports `checkout.completed` and `subscription.paid` events. Other CREEM events are rejected.
- The browser helper reads cookies but does not set them — DataFast's tracking script handles that.
- The in-memory idempotency store is not suitable for production (resets on restart, not shared across instances).
- CREEM webhook payload shapes are based on available documentation. If CREEM changes their payload format, mapper functions may need updating.

## Example app

A full Next.js example is included in [`examples/nextjs/`](examples/nextjs/) showing the complete flow: landing page → CREEM checkout → payment success → DataFast attribution via webhook.

### Quickstart

```bash
# 1. Clone the repo
git clone https://github.com/aniketmohite/creem-datafast-demo.git
cd creem-datafast-demo

# 2. Install and build the package
npm install
npm run build

# 3. Set up the example app
cd examples/nextjs
npm install
cp .env.example .env.local
# Edit .env.local with your CREEM and DataFast credentials

# 4. Start the dev server
npm run dev
```

For webhook testing locally, use [ngrok](https://ngrok.com) to expose your local server and set `APP_URL` in `.env.local` to your ngrok URL.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Typecheck
npm run typecheck

# Lint
npm run lint
```

## License

MIT
