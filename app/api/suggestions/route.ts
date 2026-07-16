import { NextResponse } from 'next/server';
import { getChatCompletion } from '@/lib/openrouter';

export async function GET() {
  try {
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
    ]);

    const ideas = JSON.parse(content);
    return NextResponse.json({ suggestions: ideas });
  } catch {
    return NextResponse.json({
      suggestions: ['Campus flood alert system', 'Barangay health tracker', 'Offline learning app']
    });
  }
}
