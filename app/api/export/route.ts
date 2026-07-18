import { NextResponse } from 'next/server';
import MarkdownIt from 'markdown-it';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { Evaluation } from '@/types';
import { getChatCompletion, ChatMessage, type LLMProvider } from '@/lib/llm-providers';
import { handleAPIError } from '@/lib/api-error';
import { getOrSet } from '@/lib/cache';
import { simpleHash } from '@/lib/hash';

const md = new MarkdownIt();

export async function POST(request: Request) {
  try {
    const { evaluation, messages, sessionId, workspaceNodes, workspaceEdges, provider: reqProvider, userApiKey } = await request.json();
    const provider: LLMProvider = reqProvider || "nvidia";

    const conversationText = (messages as { role: string; content: string }[])
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const cacheKey = `blueprint:${simpleHash(JSON.stringify(evaluation) + conversationText)}`;

    const { markdown: cleanedMarkdown, html, schedule } = await getOrSet(
      cacheKey,
      async () => {
        const blueprintPrompt = `You are a thesis writing assistant for CS/IT students in the Philippines.
Based on this capstone project evaluation and conversation, generate a complete Markdown blueprint document AND a structured project schedule.

Evaluation data:
${JSON.stringify(evaluation, null, 2)}

Student conversation summary:
${conversationText}

Generate a full .md file with these sections in order:
1. Project Title and Overview
2. Problem Statement (specific to the student's context)
3. Objectives (General + Specific, numbered)
4. Scope and Limitations
5. Review of Related Literature (3-5 short paragraphs referencing similar systems if any were found)
6. Proposed Methodology (system development approach)
7. System Architecture (described in text, component-level)
8. Suggested Tech Stack (with justification, free/open-source tools only)
9. Timeline and Milestones (broken down per month)
10. Team Roles and Responsibilities (generic roles based on team size)
11. Expected Output (what the system will deliver)
12. Possible Future Improvements

After the Markdown blueprint, add a JSON block on a new line (no markdown fences) with this exact structure:
{"schedule":[{"week":1,"title":"Week Title","tasks":["task1","task2"],"milestone":"optional milestone"}]}

The schedule should cover the full ${evaluation?.timeframe || '3-4 month'} timeframe, broken into weekly sprints. Each week should have 2-4 concrete tasks.

Rules:
- Use proper Markdown formatting with headers, lists, and bold text
- Be thorough but concise — this is a starter document for a student's thesis
- Only recommend FREE and open-source tools
- Tailor the content to the Philippine CS/IT academic context
- Include the research gap and research questions from the evaluation
- Reference any similar existing systems found via web search
- Do not include any preamble or explanation outside the Markdown content`;

        const aiMessages: ChatMessage[] = [
          { role: 'user', content: blueprintPrompt }
        ];

        const rawMarkdown = await getChatCompletion(aiMessages, provider, userApiKey);
        const cleaned = rawMarkdown.replace(/^```markdown\n?/i, '').replace(/\n?```$/, '').trim();

        // Extract schedule JSON from the end of the response
        let schedule: { week: number; title: string; tasks: string[]; milestone?: string }[] = [];
        const scheduleMatch = cleaned.match(/\{"schedule":\[[\s\S]*?\]\}\s*$/);
        if (scheduleMatch) {
          try {
            const scheduleData = JSON.parse(scheduleMatch[0]);
            schedule = scheduleData.schedule || [];
          } catch {
            // Schedule parsing failed — not critical
          }
        }

        // Remove the schedule JSON from the markdown
        const cleanedMarkdown = cleaned.replace(/\{"schedule":\[[\s\S]*?\]\}\s*$/, '').trim();
        const rendered = md.render(cleanedMarkdown);

        return { markdown: cleanedMarkdown, html: rendered, schedule };
      },
      604800 // 7 days
    );

    const { userId } = await auth();
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (userId) {
      if (sessionId) {
        // Update existing session (created during evaluation) with blueprint and workspace
        await supabase.from('sessions').update({
          blueprint: cleanedMarkdown,
          workspace_nodes: workspaceNodes || '[]',
          workspace_edges: workspaceEdges || '[]',
          updated_at: new Date().toISOString(),
        }).eq('id', sessionId).eq('user_id', userId);
      } else {
        // Create new session (fallback for direct export without evaluation)
        await supabase.from('sessions').insert({
          user_id: userId,
          title: evaluation?.title || 'Untitled Session',
          conversation: messages,
          blueprint: cleanedMarkdown,
          workspace_nodes: workspaceNodes || '[]',
          workspace_edges: workspaceEdges || '[]',
        });
      }
    }

    return NextResponse.json({ markdown: cleanedMarkdown, html, schedule });
  } catch (error) {
    return handleAPIError(error);
  }
}
