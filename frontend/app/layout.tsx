import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Легенды Бауманки 2026 — МГТУ им. Н.Э. Баумана",
  description:
    "Легенды Бауманки — крупнейший квест по территории, истории и традициям МГТУ им. Н.Э. Баумана. Собирай команду, регистрируйся и раскрой все тайны университета.",
};

export const viewport: Viewport = {
  themeColor: "#08183a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
