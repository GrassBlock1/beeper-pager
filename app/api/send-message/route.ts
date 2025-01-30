import { NextResponse } from "next/server"
import { LRUCache } from "lru-cache";

// fixes build on cloudflare pages
export const runtime = 'edge';

const CLOUDFLARE_SECRET_KEY = process.env.CLOUDFLARE_SECRET_KEY
const NTFY_TOPIC = process.env.NTFY_TOPIC
const NTFY_HOST = process.env.NTFY_HOST ? process.env.NTFY_HOST : "ntfy.sh"
const NTFY_TOKEN = process.env.NTFY_TOKEN
const environment = process.env.NODE_ENV

// Rate limiting configuration
const rateLimit = 5 // requests
const rateLimitPeriod = 60 * 60 * 1000 // 1 hour in milliseconds

const rateLimiter = new LRUCache({
  max: 500, // Maximum number of users to track
  ttl: rateLimitPeriod,
})

function getRateLimitInfo(ip: string): { count: number; timestamp: number } {

  const rateLimitInfo: { count: number; timestamp: number } = rateLimiter.get(ip) as { count: number; timestamp: number } || { count: 0, timestamp: Date.now() }
  const currentTimestamp = Date.now()

  if (currentTimestamp - rateLimitInfo.timestamp > rateLimitPeriod) {
    rateLimitInfo.count = 0
    rateLimitInfo.timestamp = currentTimestamp
  }

  return rateLimitInfo
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const message = formData.get('message') as string;
  const turnstileResponse = formData.get("cf-turnstile-response") as string;

  // rate limit check
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "unknown"
  const rateLimitInfo = getRateLimitInfo(ip)

  if (rateLimitInfo.count >= rateLimit) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
  }

  rateLimitInfo.count++
  rateLimiter.set(ip, rateLimitInfo)


  // Verify Turnstile response
  if (environment !== "development") {
    const turnstileVerification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: CLOUDFLARE_SECRET_KEY,
        response: turnstileResponse,
      }),
    });

    const turnstileResult = await turnstileVerification.json();

    if (!turnstileResult.success) {
      return NextResponse.json({error: "Turnstile verification failed"}, {status: 400});
    }
  }
  // Send message to ntfy
  const ntfyResponse = await fetch(`https://${NTFY_HOST}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Markdown": "yes",
      ...(NTFY_TOKEN && { "Authorization": `Bearer ${NTFY_TOKEN}` }),
    },
    body: JSON.stringify({
      topic: NTFY_TOPIC,
      message: message,
      priority: 5, // Highest priority for emergency messages
      tags: ["warning", "sos"],
    }),
  });

  if (ntfyResponse.ok) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}