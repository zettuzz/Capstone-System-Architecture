import { getChatCompletionStream, ChatMessage } from '@/lib/openrouter';
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
{"action":"create_node","nodeTitle":"TITLE","nodeSummary":"2-3 sentence summary","nodeType":"topic","parentNodeId":"PARENT_ID"}
-->

Or for research:
<!-- INTERVIEW_INSTRUCTION
{"action":"search_research","query":"search query here"}
-->

Or for grading:
<!-- INTERVIEW_INSTRUCTION
{"action":"grade_project"}
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
- After research is shown to student, if they seem satisfied, use "grade_project"
- The parentNodeId is usually "idea-hub" for top-level topics, or the id of a more specific parent
- nodeType is "topic" for most nodes, "research" for research findings
- nodeSummary should capture the KEY DECISION or INFORMATION from the exchange`;

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'anonymous';

    const rateLimit = await checkRateLimit(`ratelimit:chat:${ip}`, 30, 3600);
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

    const { messages, title, searchContext, nodeTitle, nodeContext } = await request.json();

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

    if (searchContext) {
      systemMessage += `\n\n## Web Search Results (similar systems found):\n${searchContext}\n\nUse these results to inform your response. Reference specific systems when relevant. Identify what's novel vs what already exists.`;
    }

    const formattedMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages.filter((m: { role: string }) => m.role !== 'system')
    ];

    const stream = await getChatCompletionStream(formattedMessages);
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
        } catch (err) {
          controller.enqueue(encoder.encode(`3:${JSON.stringify(err)}\n`));
        } finally {
          controller.close();
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
