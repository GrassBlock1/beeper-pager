import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Emergency Message Sender",
  description: "Send emergency messages using ntfy.sh",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {process.env.NODE_ENV === "development" ? null :
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        }
      </body>
    </html>
  )
}

