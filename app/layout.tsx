import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "芽伴｜1–3年级家庭成长规划助手",
  description: "了解孩子，也帮助父母找到下一步。生成具体、温和、可执行的家庭成长计划。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "芽伴｜看见孩子的节奏，找到下一步",
    description: "面向1–3年级家庭的AI成长规划助手",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
