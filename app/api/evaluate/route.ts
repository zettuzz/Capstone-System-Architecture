import { NextResponse } from 'next/server';
import { getChatCompletion } from '@/lib/openrouter';
import { searchWeb } from '@/lib/tavily';
import { getOrSet } from '@/lib/cache';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

interface Message {
  role: string;
  content: string;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function extractSearchQuery(title: string, messages: Message[]): string {
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');
  const query = `${title} capstone project ${userMessages.slice(0, 200)}`;
  return query;
}

function formatSearchResults(results: { results?: Array<{ title: string; url: string; content: string }> }): string {
  if (!results.results || results.results.length === 0) {
    return 'No similar systems found via web search.';
  }

  return results.results
    .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.content}`)
    .join('\n\n');
}

export async function POST(request: Request) {
  try {
    const { messages, title } = await request.json();

    const conversationText = (messages as Message[])
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const cacheKey = `eval:${simpleHash(title + conversationText)}`;

    const evaluation = await getOrSet(
      cacheKey,
      async () => {
        let searchResultsFormatted = 'Search was not performed.';
        let existingSystems: string[] = [];
        let githubRepos: { name: string; fullName: string; description: string; url: string; stars: number; language: string; updatedAt: string }[] = [];

        try {
          const query = extractSearchQuery(title || 'capstone project', messages as Message[]);
          const results = await searchWeb(query, 5);
          searchResultsFormatted = formatSearchResults(results);
          existingSystems = (results.results || []).map((r: { title: string }) => r.title);
        } catch (searchError) {
          console.warn('Web search failed, proceeding without search results:', searchError);
        }

        try {
          const ghQuery = `${title || ''} capstone thesis`.trim();
          const origin = new URL(request.url).origin;
          const ghRes = await fetch(`${origin}/api/github-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: ghQuery }),
          });
          if (ghRes.ok) {
            const ghData = await ghRes.json();
            githubRepos = ghData.repos || [];
          }
        } catch (ghError) {
          console.warn('GitHub search failed:', ghError);
        }

        const systemPrompt = `You are CapstoneAI, an expert thesis adviser evaluating a capstone project for CS/IT students in the Philippines.
Analyze the conversation and provide a structured evaluation for the capstone idea. Respond with valid JSON only, no additional text.

## Web Search Results — Similar Existing Systems
${searchResultsFormatted}

## GitHub Repos — Similar Projects
${githubRepos.length > 0 ? githubRepos.map((r, i) => `${i + 1}. **${r.fullName}** (${r.stars}★) — ${r.description}\n   ${r.url}`).join('\n') : 'No similar GitHub repos found.'}

Use these results to:
- Identify what already exists vs. what is novel in the Philippine context
- Strengthen the researchGap field with specific gaps not covered by existing work
- Reference real systems and GitHub repos in improvements and researchQuestions
- Note if similar open-source projects exist that could be built upon

Evaluation criteria for Filipino CS/IT students:
- Feasibility for a 2-4 person team in 3-6 months
- Use of FREE and open-source tools only
- Real-world relevance to Philippine communities
- Technical depth suitable for a CS/IT thesis

The JSON should have this structure:
{
  "title": "${title || 'Unknown Project'}",
  "score": <number 1-10>,
  "feasibility": "<High|Medium|Low>",
  "timeframe": "<string like '3-4 months'>",
  "teamSize": <number 1-5>,
  "suggestedStack": ["<free/open-source tech>", "<tech>", ...],
  "improvements": ["<suggestion>", ...],
  "researchGap": "<string describing research contribution in Philippine context>",
  "researchQuestions": ["<question>", ...],
  "existingSystems": ["<name and brief description of similar system found>", ...]
}`;

        const content = await getChatCompletion([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: conversationText }
        ]);

        try {
          const parsed = JSON.parse(content);
          parsed.existingSystems = existingSystems;
          parsed.githubRepos = githubRepos;
          return parsed;
        } catch {
          return {
            title: title || 'Unknown Project',
            score: 7.5,
            feasibility: 'Medium',
            timeframe: '3-4 months',
            teamSize: 2,
            suggestedStack: ['TypeScript', 'React', 'Node.js'],
            improvements: ['Add novel technical components', 'Consider research contribution'],
            researchGap: 'Need deeper analysis of existing solutions',
            researchQuestions: ['What makes this project unique?', 'What are the technical challenges?'],
            existingSystems,
            githubRepos,
          };
        }
      },
      86400 // 24 hours
    );

    // Save evaluation to DB if user is authenticated
    let sessionId: string | null = null;
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Create a session for this evaluation
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            title: evaluation.title || title || 'Untitled Session',
            conversation: messages,
          })
          .select('id')
          .single();

        if (!sessionError && session) {
          sessionId = session.id;

          // Save evaluation linked to session
          await supabase.from('evaluations').insert({
            session_id: sessionId,
            user_id: user.id,
            title: evaluation.title,
            score: evaluation.score,
            feasibility: evaluation.feasibility,
            timeframe: evaluation.timeframe,
            team_size: evaluation.teamSize,
            suggested_stack: evaluation.suggestedStack,
            improvements: evaluation.improvements,
            research_gap: evaluation.researchGap,
            research_questions: evaluation.researchQuestions,
            existing_systems: evaluation.existingSystems || [],
            github_repos: evaluation.githubRepos || [],
            schedule: evaluation.schedule || [],
          });
        }
      }
    } catch (dbError) {
      console.warn('Failed to save evaluation to DB:', dbError);
    }

    return NextResponse.json({ evaluation, sessionId });
  } catch (error) {
    console.error('Error in evaluate API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
