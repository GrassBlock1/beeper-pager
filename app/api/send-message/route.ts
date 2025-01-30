import { NextResponse } from "next/server"
import type { NextApiResponse } from "next";
import rateLimit from "../rate-limit";

// fixes build on cloudflare pages
export const runtime = 'edge';

const CLOUDFLARE_SECRET_KEY = process.env.CLOUDFLARE_SECRET_KEY
const NTFY_TOPIC = process.env.NTFY_TOPIC
const NTFY_HOST = process.env.NTFY_HOST ? process.env.NTFY_HOST : "ntfy.sh"
const NTFY_TOKEN = process.env.NTFY_TOKEN
const environment = process.env.NODE_ENV

const limiter = rateLimit({
  interval: 60 * 1000 * 60, // 1 hour
  uniqueTokenPerInterval: 50, // Max 5 users per second
});

export async function POST(request: Request, res: NextApiResponse) {
  const formData = await request.formData();
  const message = formData.get('message') as string;
  const turnstileResponse = formData.get("cf-turnstile-response") as string;

  // rate limit check
  try {
    await limiter.check(res, 1, "CACHE_TOKEN"); // 1 request per hour
  } catch {
    NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
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