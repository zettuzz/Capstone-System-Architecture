import { NextResponse } from 'next/server';
import { getChatCompletion, type LLMProvider } from '@/lib/llm-providers';
import { handleAPIError } from '@/lib/api-error';

export async function POST(request: Request) {
  try {
    const { provider: reqProvider, userApiKey } = await request.json();
    const provider: LLMProvider = reqProvider || "nvidia";

    const content = await getChatCompletion([
      {
        role: 'system',
        content: `You are CapstoneAI, an expert thesis adviser for CS/IT students in the Philippines.
Generate exactly 3 capstone project ideas that are:
- Realistic for a 2-4 person student team
- Solvable in 3-6 months
- Focused on real-world problems faced by Filipinos (education, transportation, healthcare, agriculture, government services, etc.)
- Built with FREE and open-source tools only

Each idea should be a short phrase (2-5 words) suitable for a button label. Return ONLY a JSON array of strings, no additional text.
Examples of good format: ["Campus flood alert system", "Barangay health tracker", "Offline learning app"]`
      },
      {
        role: 'user',
        content: 'Generate 3 capstone project ideas for Filipino CS/IT students.'
      }
    ], provider, userApiKey);

    const ideas = JSON.parse(content);
    return NextResponse.json({ suggestions: ideas });
  } catch (error) {
    const errorResponse = handleAPIError(error);
    if (errorResponse.status === 500) {
      return NextResponse.json({
        suggestions: ['Campus flood alert system', 'Barangay health tracker', 'Offline learning app']
      });
    }
    return errorResponse;
  }
}
