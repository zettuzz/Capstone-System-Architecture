import OpenAI from "openai";

const getOpenRouterClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const baseURL =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  return new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: {
      "HTTP-Referer": "https://capstone-ai.vercel.app",
      "X-OpenRouter-Title": "CapstoneAI",
    },
  });
};

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function getChatCompletion(messages: ChatMessage[]) {
  const client = getOpenRouterClient();
  const completion = await client.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    messages,
    temperature: 0.7,
    top_p: 1.0,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function getChatCompletionStream(messages: ChatMessage[]) {
  const client = getOpenRouterClient();
  return client.chat.completions.create({
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    messages,
    temperature: 0.7,
    top_p: 1.0,
    stream: true,
  });
}
