import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OpraMeet — Video Meetings for Everyone",
  description: "Secure, premium, and free multi-party WebRTC video meetings powered by OpraMeet.",
  openGraph: {
    title: "OpraMeet — Video Meetings for Everyone",
    description: "Premium video meetings. Secure, private, and free.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpraMeet — Video Meetings for Everyone",
    description: "Premium video meetings. Secure, private, and free.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
      </head>
      <body>
        <main className="min-h-screen bg-bg-app text-text-primary flex flex-col font-sans antialiased">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              boxShadow: "var(--shadow-lg)",
            },
            success: {
              iconTheme: {
                primary: "var(--success)",
                secondary: "var(--text-on-accent)",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--danger)",
                secondary: "var(--text-on-accent)",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
