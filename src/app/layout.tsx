import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ToastProvider from "@/components/toast-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaskMaster Pro - 任务管理系统",
  description: "高效的任务管理与督办系统",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
