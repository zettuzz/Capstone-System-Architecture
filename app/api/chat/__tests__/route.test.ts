import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/chat/route";
import { checkRateLimit } from "@/lib/ratelimit";

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    headers: { "x-forwarded-for": "127.0.0.1" },
    body: JSON.stringify(body),
  });
}

function makeStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = "test-key";
  process.env.NVIDIA_API_KEY = "test-key";
  mockFetch.mockReset();
  (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
    allowed: true,
    remaining: 29,
    resetAt: Date.now() + 60000,
  });
});

describe("POST /api/chat", () => {
  it("returns streaming response with correct content-type", async () => {
    mockFetch.mockResolvedValue(makeStreamResponse(["Hello"]));

    const res = await POST(makeRequest({ messages: [{ role: "user", content: "Hi" }] }));

    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });

    const res = await POST(makeRequest({ messages: [{ role: "user", content: "Hi" }] }));

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Rate limit");
  });

  it("calls LLM API with correct messages", async () => {
    mockFetch.mockResolvedValue(makeStreamResponse(["Hey", " there"]));

    const res = await POST(makeRequest({ messages: [{ role: "user", content: "Hi" }] }));

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("api"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("returns 500 on unexpected error", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    const res = await POST(makeRequest({ messages: [{ role: "user", content: "Hi" }] }));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Network failure");
  });
});
