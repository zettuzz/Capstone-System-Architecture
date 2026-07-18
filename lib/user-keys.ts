export interface UserAPIKeys {
  openrouter: string;
  nvidia: string;
}

export interface TokenBudget {
  totalUsed: number;
  totalLimit: number;
  dailyUsed: number;
  dailyLimit: number;
  lastResetDate: string;
}

const KEYS_STORAGE_KEY = "capstoneai_user_api_keys";
const TOKEN_BUDGET_KEY = "capstoneai_token_budget";

// 50 users × 3 projects × ~41K tokens = ~6.15M total
// Per user: 150K tokens total, 5K/day
export const TOKEN_LIMIT_TOTAL = 150_000;
export const TOKEN_LIMIT_DAILY = 5_000;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function estimateTokens(text: string): number {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

export function estimateTokensFromMessages(
  messages: { role: string; content: string }[]
): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}

export function getUserKeys(): UserAPIKeys {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (!raw) return { openrouter: "", nvidia: "" };
    const parsed = JSON.parse(raw);
    return {
      openrouter: typeof parsed.openrouter === "string" ? parsed.openrouter : "",
      nvidia: typeof parsed.nvidia === "string" ? parsed.nvidia : "",
    };
  } catch {
    return { openrouter: "", nvidia: "" };
  }
}

export function saveUserKeys(keys: UserAPIKeys): void {
  try {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {}
}

export function getUserKeyForProvider(provider: "openrouter" | "nvidia"): string {
  return getUserKeys()[provider] || "";
}

export function getTokenBudget(): TokenBudget {
  const today = todayString();
  try {
    const raw = localStorage.getItem(TOKEN_BUDGET_KEY);
    if (!raw) {
      return {
        totalUsed: 0,
        totalLimit: TOKEN_LIMIT_TOTAL,
        dailyUsed: 0,
        dailyLimit: TOKEN_LIMIT_DAILY,
        lastResetDate: today,
      };
    }
    const parsed = JSON.parse(raw);
    const lastReset = parsed.lastResetDate || today;
    const needsDailyReset = lastReset !== today;
    return {
      totalUsed: typeof parsed.totalUsed === "number" ? parsed.totalUsed : 0,
      totalLimit: TOKEN_LIMIT_TOTAL,
      dailyUsed: needsDailyReset ? 0 : (typeof parsed.dailyUsed === "number" ? parsed.dailyUsed : 0),
      dailyLimit: TOKEN_LIMIT_DAILY,
      lastResetDate: needsDailyReset ? today : lastReset,
    };
  } catch {
    return {
      totalUsed: 0,
      totalLimit: TOKEN_LIMIT_TOTAL,
      dailyUsed: 0,
      dailyLimit: TOKEN_LIMIT_DAILY,
      lastResetDate: today,
    };
  }
}

export function consumeTokens(inputTokens: number, outputTokens: number): TokenBudget {
  const budget = getTokenBudget();
  const total = inputTokens + outputTokens;
  const newTotalUsed = budget.totalUsed + total;
  const newDailyUsed = budget.dailyUsed + total;
  const updated: TokenBudget = {
    totalUsed: newTotalUsed,
    totalLimit: TOKEN_LIMIT_TOTAL,
    dailyUsed: newDailyUsed,
    dailyLimit: TOKEN_LIMIT_DAILY,
    lastResetDate: todayString(),
  };
  try {
    localStorage.setItem(TOKEN_BUDGET_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function canMakeTokenRequest(): boolean {
  const budget = getTokenBudget();
  return budget.totalUsed < budget.totalLimit && budget.dailyUsed < budget.dailyLimit;
}

export function getTokensRemaining(): number {
  const budget = getTokenBudget();
  return Math.max(0, budget.totalLimit - budget.totalUsed);
}

export function getDailyTokensRemaining(): number {
  const budget = getTokenBudget();
  return Math.max(0, budget.dailyLimit - budget.dailyUsed);
}
