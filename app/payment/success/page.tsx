"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const checkoutId = searchParams.get("checkout_id");

  useEffect(() => {
    // CREEM redirects with query params after payment
    // Small delay to let webhook process
    const timer = setTimeout(() => {
      setStatus("success");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (status === "loading") {
    return (
      <main style={containerStyle}>
        <div style={cardStyle}>
          <div style={spinnerWrapperStyle}>
            <div style={spinnerStyle} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
            Confirming your payment...
          </h1>
          <p style={{ color: "#666", margin: 0 }}>
            Please wait while we verify your purchase.
          </p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: spinnerKeyframes }} />
      </main>
    );
  }

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#f0fdf4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 8px",
            color: "#111",
          }}
        >
          Payment Successful
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "#666",
            margin: "0 0 32px",
            lineHeight: 1.5,
          }}
        >
          Thank you for your purchase! Your DataFast Pro subscription is now
          active.
        </p>

        {checkoutId && (
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 32,
              fontSize: 14,
              color: "#555",
              wordBreak: "break-all",
            }}
          >
            <span style={{ fontWeight: 600, color: "#333" }}>Order ID: </span>
            {checkoutId}
          </div>
        )}

        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <a
            href="/"
            style={{
              display: "block",
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
              background:
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: 12,
              textAlign: "center",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}

const containerStyle: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "#fafafa",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: "48px 40px",
  maxWidth: 480,
  width: "100%",
  textAlign: "center",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.04)",
};

const spinnerWrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 24,
};

const spinnerStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  border: "4px solid #e5e7eb",
  borderTopColor: "#667eea",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const spinnerKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
