import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "芽伴｜给1–3年级家长的成长规划助手",
  description: "家长填写孩子状态，生成具体、温和、可反馈调整的家庭成长计划。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "芽伴｜帮助家长看见孩子的节奏",
    description: "面向1–3年级家长的AI成长规划与行动助手",
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
