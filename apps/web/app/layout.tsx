// Root layout. Owner: Anuj.
import "./globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "SpendGuard — AI API Cost Tracker",
  description:
    "Monitor, analyze, and control AI API spending across OpenAI, Anthropic, Gemini and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-gray-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
