import type { InterviewInstruction } from '@/types';

const INSTRUCTION_REGEX = /<!--\s*INTERVIEW_INSTRUCTION\s*([\s\S]*?)\s*-->/;
const JSON_BLOCK_REGEX = /INTERVIEW_INSTRUCTION\s*(\{[\s\S]*?\})\s*$/m;
const PLAIN_TEXT_REGEX = /INTERVIEW_INSTRUCTION[:\s]+(.+)/i;

export function parseInstruction(content: string): { clean: string; instruction: InterviewInstruction | null } {
  const htmlMatch = content.match(INSTRUCTION_REGEX);
  if (htmlMatch) {
    const clean = content.replace(INSTRUCTION_REGEX, '').trim();
    try {
      return { clean, instruction: JSON.parse(htmlMatch[1]) as InterviewInstruction };
    } catch {
      return { clean, instruction: null };
    }
  }

  const jsonMatch = content.match(JSON_BLOCK_REGEX);
  if (jsonMatch) {
    const clean = content.replace(JSON_BLOCK_REGEX, '').trim();
    try {
      return { clean, instruction: JSON.parse(jsonMatch[1]) as InterviewInstruction };
    } catch {
      return { clean, instruction: null };
    }
  }

  const plainMatch = content.match(PLAIN_TEXT_REGEX);
  if (plainMatch) {
    const clean = content.replace(PLAIN_TEXT_REGEX, '').trim();
    try {
      return { clean, instruction: JSON.parse(plainMatch[1]) as InterviewInstruction };
    } catch {
      return { clean, instruction: null };
    }
  }

  return { clean: content, instruction: null };
}

const SUGGESTION_PATTERNS = [
  /we should (also|now) (talk about|discuss|consider|explore)/i,
  /this (relates?|connects?|leads?) to/i,
  /you might want to (also|separately)/i,
  /let's (create|start|make) (a |another )?(new )?(separate )?(node|topic|thread)/i,
];

const NODE_TITLE_PATTERNS = [
  /let's (?:create|start|make) (?:a |another )?(?:new )?(?:separate )?(?:node|topic|thread) (?:for |about |on )["']?([^"'.]+)["']?/i,
  /(?:create|start|make) (?:a |another )?(?:new )?(?:node|topic|thread) (?:for |about |on )["']?([^"'.]+)["']?/i,
  /(?:talk about|discuss|consider|explore) ["']?([^"'.]+)["']?/i,
];

export function shouldSuggestNode(content: string, existingMessages: { role: string; content: string }[]): boolean {
  if (existingMessages.length < 3) return false;
  return SUGGESTION_PATTERNS.some(p => p.test(content));
}

export function extractNodeSuggestion(content: string): string | null {
  for (const pattern of NODE_TITLE_PATTERNS) {
    const match = content.match(pattern);
    if (match?.[1]) {
      return match[1].trim().slice(0, 50);
    }
  }
  return null;
}
