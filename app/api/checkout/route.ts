import { createCreemDataFast } from "creem-datafast-sdk";

const cd = createCreemDataFast({
  creemApiKey: process.env.CREEM_API_KEY!,
  creemWebhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  datafastApiKey: process.env.DATAFAST_API_KEY!,
  creemServerIdx: 1, // sandbox
  debug: true,
});

export async function POST(request: Request): Promise<Response> {
  try {
    const { visitorId } = (await request.json()) as {
      visitorId?: string;
    };

    const productId = process.env.CREEM_PRODUCT_ID!;

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const successUrl = `${appUrl}/payment/success`;

    const checkout = await cd.createCheckout({
      input: {
        productId,
        successUrl,
        metadata: {},
      },
      datafastVisitorId: visitorId,
    });

    console.log("Checkout created:", {
      id: checkout.id,
      checkoutUrl: checkout.checkoutUrl,
      metadata: checkout.metadata,
    });

    return Response.json({
      id: checkout.id,
      checkoutUrl: checkout.checkoutUrl,
      status: checkout.status,
      metadata: checkout.metadata,
    });
  } catch (error) {
    console.error("Checkout creation failed:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
