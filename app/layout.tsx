export const metadata = {
  title: "DataFast Pro — Analytics that drive revenue",
  description:
    "Unlock powerful analytics with real-time visitor tracking, revenue attribution, and conversion insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
              body { background: #fff; -webkit-font-smoothing: antialiased; }
              @media (max-width: 768px) {
                main > div { grid-template-columns: 1fr !important; gap: 32px !important; }
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
