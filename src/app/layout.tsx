import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "学校管理系统",
  description: "School Enrollment & Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
