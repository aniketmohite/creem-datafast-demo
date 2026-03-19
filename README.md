# creem-datafast-demo

A Next.js example app showing the full CREEM + DataFast integration flow: product purchase page → CREEM checkout → payment success → webhook → DataFast revenue attribution.

Uses the [`creem-datafast`](https://www.npmjs.com/package/creem-datafast) package to handle visitor tracking, checkout creation, and webhook processing.

## How it works

1. **Visitor lands on the page** — DataFast tracking script sets a `datafast_visitor_id` cookie
2. **User clicks "Buy Now"** — the app reads the cookie and creates a CREEM checkout with the visitor ID in metadata
3. **User completes payment** — CREEM redirects back to the success page
4. **CREEM sends a webhook** — the handler verifies the signature, extracts payment data, and forwards it to DataFast's payment API with the visitor attribution

## Setup

```bash
# Clone the repo
git clone https://github.com/aniketmohite/creem-datafast-demo.git
cd creem-datafast-demo

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Environment variables

| Variable | Description |
|---|---|
| `CREEM_API_KEY` | Your CREEM API key |
| `CREEM_WEBHOOK_SECRET` | Webhook signing secret from CREEM |
| `DATAFAST_API_KEY` | Your DataFast API key |
| `CREEM_PRODUCT_ID` | The CREEM product ID to sell |
| `APP_URL` | Your app's public URL (ngrok URL for local dev) |

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the product page.

### Webhook testing with ngrok

CREEM needs to reach your webhook endpoint. Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Then:
1. Copy the ngrok URL (e.g. `https://xxxx.ngrok-free.app`)
2. Set `APP_URL` in `.env.local` to the ngrok URL
3. Configure the webhook URL in your CREEM dashboard to `https://xxxx.ngrok-free.app/api/webhook/creem`
4. Restart the dev server

## Project structure

```
app/
├── page.tsx                        # Product purchase page
├── layout.tsx                      # Root layout with DataFast tracking script
├── api/
│   ├── checkout/route.ts           # POST — creates CREEM checkout with visitor attribution
│   └── webhook/creem/route.ts      # POST — handles CREEM webhook, forwards to DataFast
└── payment/
    └── success/page.tsx            # Payment confirmation page
```

## License

MIT
