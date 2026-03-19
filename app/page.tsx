"use client";

import { useState, useEffect, useRef } from "react";
import { initDataFast, type DataFastWeb } from "datafast";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const datafastRef = useRef<DataFastWeb | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDataFast({
      websiteId: process.env.NEXT_PUBLIC_DATAFAST_WEBSITE_ID!,
      apiUrl: process.env.NEXT_PUBLIC_DATAFAST_API_URL,
      allowLocalhost: true,
    }).then((client) => {
      datafastRef.current = client;
      setReady(true);
    });
  }, []);

  async function handleBuyNow() {
    if (!ready) return;

    setLoading(true);
    try {
      datafastRef.current?.track("buy_now_click", { product: "datafast_pro" });
      const visitorId = datafastRef.current?.getVisitorId() ?? undefined;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: 1100,
        margin: "0 auto",
        padding: "60px 24px",
        color: "#111",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        {/* Product Image */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 16,
            aspectRatio: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 60%)",
            }}
          />
          <div style={{ textAlign: "center", position: "relative" }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>⚡</div>
            <div
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Pro Plan
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div>
          <div
            style={{
              display: "inline-block",
              background: "#f0fdf4",
              color: "#16a34a",
              fontSize: 13,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 20,
              marginBottom: 16,
            }}
          >
            Most Popular
          </div>

          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.2,
              margin: "0 0 12px",
            }}
          >
            DataFast Pro
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#555",
              lineHeight: 1.6,
              margin: "0 0 32px",
            }}
          >
            Unlock powerful analytics with real-time visitor tracking, revenue
            attribution, and conversion insights. Everything you need to
            understand your customers.
          </p>

          <div style={{ marginBottom: 32 }}>
            <span style={{ fontSize: 48, fontWeight: 700 }}>$1</span>
            <span style={{ fontSize: 18, color: "#888", marginLeft: 4 }}>
              /month
            </span>
          </div>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 40px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[
              "Unlimited visitor tracking",
              "Real-time revenue attribution",
              "Conversion funnel analytics",
              "Webhook integrations",
              "Priority support",
            ].map((feature) => (
              <li
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 15,
                  color: "#333",
                }}
              >
                <span
                  style={{
                    color: "#16a34a",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={handleBuyNow}
            disabled={loading || !ready}
            style={{
              width: "100%",
              padding: "16px 32px",
              fontSize: 17,
              fontWeight: 600,
              color: "#fff",
              background: loading
                ? "#999"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "Redirecting to checkout..." : "Buy Now"}
          </button>

          <p
            style={{
              fontSize: 13,
              color: "#999",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Secure payment powered by CREEM. Cancel anytime.
          </p>
        </div>
      </div>
    </main>
  );
}
