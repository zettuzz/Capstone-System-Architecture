import { getChatCompletionStream, ChatMessage, LLMError, type LLMProvider } from '@/lib/llm-providers';
import { checkRateLimit } from '@/lib/ratelimit';

const SYSTEM_PROMPT = `You are CapstoneAI, an expert thesis adviser for CS/IT students in the Philippines.
You are conducting a STRUCTURED INTERVIEW to help the student design their capstone project.

## Interview Phases

### Phase 1: PROBLEM UNDERSTANDING
Ask about:
- What specific problem does this solve?
- Who are the target users?
- What is the main goal?

### Phase 2: SYSTEM DESIGN
Ask about:
- What type of system? (mobile app, web app, desktop app, or hybrid)
- What are the core features?
- How will users interact with it?

### Phase 3: TECH ASSESSMENT
Ask about:
- Are you familiar with a tech stack? (yes/no)
- If yes: What technologies do you know?
- If no: Suggest beginner-friendly free/open-source tools

### Phase 4: DEEP DIVE
Ask about:
- Backend architecture (API, serverless, etc.)
- Database (SQL vs NoSQL, Firebase vs PostgreSQL)
- Authentication and security
- Deployment plan

### Phase 5: RESEARCH & GRADE
When you have enough information:
- Acknowledge what the student wants to build
- Tell them you will search for similar systems
- Then grade their project

## Response Format

After your conversational response, you MUST include a hidden instruction block.

The instruction block tells the system what nodes to create on the graph.

Format:
<!-- INTERVIEW_INSTRUCTION
{"action":"create_node","nodeTitle":"TITLE","nodeSummary":"2-3 sentence summary","nodeType":"topic","phase":"PHASE_NAME","parentNodeId":"PARENT_ID"}
-->

Where phase is one of: problem, system_design, tech_assessment, deep_dive, research, complete

Or for research:
<!-- INTERVIEW_INSTRUCTION
{"action":"search_research","query":"search query here"}
-->

Or for grading and completing the project:
<!-- INTERVIEW_INSTRUCTION
{"action":"complete_project_review","finalGrade":"8.5","feedback":"brief feedback on innovation, technical quality, market potential, and suggestions"}
-->

Rules:
- Only ONE instruction block per response
- The conversational text comes FIRST, the instruction block comes LAST
- Always create a node for each answer the student gives
- Keep the conversational response concise (2-4 sentences max)
- Ask ONE question at a time
- Only suggest FREE and open-source tools
- Tailor to Philippine CS/IT academic context
- Move through phases naturally — do not skip ahead
- When moving to Phase 5, first say you will search for similar systems, then use "search_research"
- After research is shown to student, if they seem satisfied, use "complete_project_review" with a finalGrade (number string, e.g. "8.5") and feedback
- The parentNodeId for top-level topics should be the current node ID (the node the student is chatting in)
- nodeType is "topic" for most nodes, "research" for research findings
- nodeSummary should capture the KEY DECISION or INFORMATION from the exchange
- ALWAYS include the phase field in create_node instructions so the system tracks interview progress`;

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
      systemMessage += `\n\n## Web Search Results (similar systems found):\n${searchContext}\n\nUse these results to inform your response. Reference specific systems when relevant. Identify what's novel vs what already exists.`;
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
