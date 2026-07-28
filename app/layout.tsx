import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://soop-unified-manager.vercel.app"),
  title: "SOOP Unified — 즐겨찾기·구독 웹 관리",
  description:
    "SOOP 즐겨찾기와 구독 스트리머를 한 화면에서 검색하고 바로 설정하는 로컬 연결형 웹 대시보드.",
  keywords: [
    "SOOP",
    "숲",
    "Tampermonkey",
    "즐겨찾기",
    "구독",
    "스트리머 관리",
  ],
  authors: [{ name: "heggng" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "SOOP Unified Manager",
    title: "SOOP Unified — 즐겨찾기·구독 웹 관리",
    description:
      "즐겨찾기와 구독 스트리머를 웹 대시보드 한 화면에서 바로 관리하세요.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SOOP Unified — 즐겨찾기·구독 웹 관리",
    description: "SOOP 스트리머 목록과 설정을 웹 대시보드 한 화면에서.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080b11",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
