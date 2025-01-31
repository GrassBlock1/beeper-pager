"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export default function EmergencyMessageForm() {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Message Sent",
          description: "Your emergency message has been sent successfully.",
        })
        setMessage("")
        formRef.current?.reset()
      } else {
        throw new Error(data.error || "Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send the emergency message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-md">
      <Textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your emergency message here, markdown is supported"
        className="mb-4"
        required
      />
      <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY}></div>
      <Button type="submit" className="w-full mt-4" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Emergency Message"}
      </Button>
    </form>
  )
}

