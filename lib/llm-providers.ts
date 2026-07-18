export type LLMProvider = "openrouter" | "nvidia";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class LLMError extends Error {
  status: number;
  retryAfter: number | null;
  provider: LLMProvider;
  constructor(message: string, status: number, provider: LLMProvider, retryAfter: number | null = null) {
    super(message);
    this.name = "LLMError";
    this.status = status;
    this.provider = provider;
    this.retryAfter = retryAfter;
  }
}

const OPENROUTER_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
const NVIDIA_MODEL = "nvidia/llama-3.3-nemotron-super-49b-v1";

function getProviderConfig(provider: LLMProvider, userApiKey?: string) {
  switch (provider) {
    case "openrouter":
      return { url: "https://openrouter.ai/api/v1/chat/completions", apiKey: userApiKey || process.env.OPENROUTER_API_KEY || "", model: OPENROUTER_MODEL };
    case "nvidia":
      return { url: "https://integrate.api.nvidia.com/v1/chat/completions", apiKey: userApiKey || process.env.NVIDIA_API_KEY || "", model: NVIDIA_MODEL };
  }
}

function getProviderDefaults(provider: LLMProvider) {
  switch (provider) {
    case "openrouter":
      return { temperature: 0.8, max_tokens: 2048 };
    case "nvidia":
      return { temperature: 0.6, max_tokens: 2048 };
  }
}

function toLLMError(err: unknown, provider: LLMProvider): LLMError {
  const apiError = err as { status?: number; message?: string; headers?: Record<string, string> };
  const status = apiError?.status || 502;
  const message = apiError?.message || `${provider} API error`;
  const retryHeader = apiError?.headers?.["retry-after"] || null;
  const retryAfter = retryHeader ? Number(retryHeader) : null;
  return new LLMError(message, status, provider, retryAfter);
}

async function fetchOpenAICompatible(
  provider: LLMProvider,
  messages: ChatMessage[],
  stream: boolean,
  userApiKey?: string
): Promise<Response> {
  const config = getProviderConfig(provider, userApiKey);
  if (!config.apiKey) throw new LLMError(`${provider.toUpperCase()}_API_KEY is not set.`, 500, provider);

  const defaults = getProviderDefaults(provider);
  const body = {
    model: config.model,
    messages,
    temperature: defaults.temperature,
    max_tokens: defaults.max_tokens,
    top_p: 1.0,
    stream,
  };

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      Accept: stream ? "text/event-stream" : "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `${provider} API error (${response.status})`;
    const retryAfter = response.headers.get("retry-after");
    try {
      const errBody = await response.json();
      if (errBody?.error?.message) message = errBody.error.message;
    } catch {}
    throw new LLMError(message, response.status, provider, retryAfter ? Number(retryAfter) : null);
  }

  return response;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  provider: LLMProvider = "nvidia",
  userApiKey?: string
): Promise<string> {
  const response = await fetchOpenAICompatible(provider, messages, false, userApiKey);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function getChatCompletionStream(
  messages: ChatMessage[],
  provider: LLMProvider = "nvidia",
  userApiKey?: string
) {
  const response = await fetchOpenAICompatible(provider, messages, true, userApiKey);
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return {
    async *[Symbol.asyncIterator]() {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6).trim();
            if (data === "[DONE]") return;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield { choices: [{ delta: { content } }] };
              }
            } catch {}
          }
        }
      }
    },
  };
}
