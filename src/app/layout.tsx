import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "CivicLens — Civic Issue Reporting",
  description: "Report potholes and civic issues with live GPS tracking and AI-powered analysis.",
  keywords: ["pothole reporting", "civic issues", "urban infrastructure"],
  openGraph: {
    title: "CivicLens",
    description: "AI-Powered Civic Issue Reporting",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#09090b" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              color: "var(--text-1)",
              borderRadius: "10px",
              fontSize: "13px",
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "var(--bg-3)" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "var(--bg-3)" } },
          }}
        />
      </body>
    </html>
  );
}
