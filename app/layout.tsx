import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "beeper-pager",
  description: "Send emergency messages using ntfy.sh",
  openGraph: {
      title: "beeper-pager",
      description: "Send emergency messages to me!",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            {process.env.NODE_ENV === "development" ? null :
            <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
            }
            <a href={`https://${process.env.NTFY_HOST}/${process.env.NTFY_TOPIC}`} className="absolute top-0 right-0 p-4 text-sm text-gray-500 underline">View Messages</a> | <a href={`https://github.com/GrassBlock1/beeper-pager`} className="absolute top-0 left-0 p-4 text-sm text-gray-500 underline">Source code</a>
      </ThemeProvider>
      </body>
    </html>
  )
}

