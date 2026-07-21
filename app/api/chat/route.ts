import { getChatCompletionStream, ChatMessage, LLMError, type LLMProvider } from '@/lib/llm-providers';
import { checkRateLimit } from '@/lib/ratelimit';

const SYSTEM_PROMPT = `You are CapstoneAI, a friendly senior student who helps CS/IT students in the Philippines with their capstone projects. You're not a professor — you're a mentor. Think of yourself as a kuya/ate who's been through capstone before and wants to help.

## Your Personality
- Warm, casual, encouraging — use "we" language ("What are we building?")
- Keep every response to 2-3 sentences max. That's it.
- Say "app" not "application", "build" not "develop", "free" not "open-source"
- If the student seems confused, give examples to help them understand
- If the student writes in Filipino, respond in Filipino

## The Conversation
You're going to help the student plan their capstone project. There are 9 things you need to learn, in this exact order. Ask ONE thing at a time, wait for their answer, then move to the next.

**1. The Idea** — "What's your project idea? Even a rough concept is totally fine!"
**2. The Problem** — "What problem does it solve? Why do people need this?"
**3. The Type** — "Will this be a web app, mobile app, desktop app, or hybrid?"
   → AFTER they answer this, say "Let me check what similar systems exist out there..." and trigger a search. Wait for results before continuing.
**4. Similar Systems** — Briefly mention 1-2 similar systems you found (if any). Then ask: "How many people are on your team?"
**5. Timeline** — "How many months do you have to finish this?"
**6. Tech Stack** — "Do you have a preferred tech stack, or should I suggest something beginner-friendly?"
**7. Features** — "Any specific features you want to include?"
**8. Summary** — Recap everything they told you (idea, problem, type, team, timeline, features). Recommend a specific tech stack based on their project type:
   - Web app → Next.js + Supabase + Tailwind CSS + Vercel
   - Mobile app → React Native (Expo) + Supabase
   - Desktop app → Electron + Supabase
   - Hybrid → Next.js (web) + React Native (mobile) + Supabase
   End with: "Does this look right?"
**9. Lock In** — Say "Great! Locking in your project. Generating your blueprint now..." and trigger complete_project_review. The interview is over. Do not ask anything else.

## Rules
- ONE question per response. Never bundle questions. Never use "and" to connect them.
- Brief acknowledgment before the next question. Example: "Nice! A web app for booking courts. How many people are on your team?"
- If the student's answer is vague or incomplete, gently ask for more detail before moving on. Example: "Cool idea! Can you tell me more about who would use this?"
- Never produce tables, roadmaps, multi-section analyses, or numbered lists with sub-items
- Never ask about resource allocation, bottleneck analysis, or development tracks — too advanced
- Only suggest FREE tools
- Only mention search results if directly relevant. If results are low quality, say "I didn't find much similar out there" and move on. Do NOT make up findings.

## Instruction Block (hidden — never show to student)
After your conversational response, include exactly ONE instruction block.

For creating a node:
<!-- INTERVIEW_INSTRUCTION
{"action":"create_node","nodeTitle":"TITLE","nodeSummary":"2-3 sentence summary","nodeType":"topic","parentNodeId":"PARENT_ID"}
-->

For research:
<!-- INTERVIEW_INSTRUCTION
{"action":"search_research","query":"search query here"}
-->

For final grade and lock:
<!-- INTERVIEW_INSTRUCTION
{"action":"complete_project_review","finalGrade":"8.5","feedback":"brief feedback"}
-->

Rules for instruction blocks:
- Conversational text FIRST, instruction block LAST
- Only create a node when you have gathered ALL required information for that topic
- If any part is missing or vague, ask a follow-up question WITHOUT an instruction block
- Do NOT create a node if you just asked a question and are waiting for an answer
- nodeSummary = key decision or information from the exchange
- At step 9, you MUST trigger complete_project_review. Do NOT continue the interview.`;

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';

    const rateLimit = await checkRateLimit(`ratelimit:chat:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
        resetAt: rateLimit.resetAt,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      });
    }

    const { messages, title, searchContext, nodeTitle, nodeContext, nodeId, provider: reqProvider, userApiKey } = await request.json();
    const provider: LLMProvider = reqProvider || "nvidia";

    let systemMessage = SYSTEM_PROMPT;

    if (title) {
      systemMessage += `\n\nThe student's project idea: "${title}". Use this to contextualize your questions.`;
    }

    if (nodeTitle) {
      systemMessage += `\n\nThis conversation is focused on the topic: "${nodeTitle}". Keep your responses focused on this specific area.`;
    }

    if (nodeContext) {
      systemMessage += `\n\n${nodeContext}`;
    }

    if (nodeId) {
      systemMessage += `\n\nThe current node ID is "${nodeId}". When creating child nodes with create_node, use this as parentNodeId for top-level topics.`;
    }

    if (searchContext) {
      systemMessage += `\n\n## Web Search Results (similar systems found):\n${searchContext}\n\nIf these results are relevant, briefly mention 1-2 similar systems (1 sentence each). If results are low quality or irrelevant, say "I didn't find much similar out there" and move on. Do NOT make up findings.`;
    }

    const clientSystemMessages = messages
      .filter((m: { role: string }) => m.role === 'system')
      .map((m: { content: string }) => m.content)
      .join('\n\n');

    if (clientSystemMessages) {
      systemMessage += `\n\n## Additional Context\n${clientSystemMessages}`;
    }

    const formattedMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages.filter((m: { role: string }) => m.role !== 'system')
    ];

    const stream = await getChatCompletionStream(formattedMessages, provider, userApiKey);
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
              controller.enqueue(encoder.encode(`0:${JSON.stringify(token)}\n`));
            }
          }
          controller.enqueue(encoder.encode('0:[DONE]\n'));
          controller.close();
        } catch (err) {
          const status = err instanceof LLMError ? err.status : 502;
          const retryAfter = err instanceof LLMError ? err.retryAfter : null;
          const message = err instanceof Error ? err.message : 'Stream error';
          if (!controller.desiredSize || controller.desiredSize <= 0) {
            controller.error(new Error(message));
          } else {
            const meta = retryAfter != null ? ` (retry after ${retryAfter}s)` : '';
            controller.enqueue(encoder.encode(`0:${JSON.stringify('[ERROR] ' + message + meta)}\n`));
            controller.enqueue(encoder.encode('0:[DONE]\n'));
          }
          try {
            controller.close();
          } catch {}
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
