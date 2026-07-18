'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type UserAPIKeys, type TokenBudget,
  getUserKeys, saveUserKeys,
  getTokenBudget, consumeTokens, canMakeTokenRequest, getTokensRemaining,
  estimateTokensFromMessages,
} from '@/lib/user-keys';

export type LLMProvider = "openrouter" | "nvidia";

interface LLMProviderContextType {
  provider: LLMProvider;
  setProvider: (p: LLMProvider) => void;
  userKeys: UserAPIKeys;
  setUserKeys: (keys: UserAPIKeys) => void;
  tokenBudget: TokenBudget;
  consumeTokensBudget: (inputTokens: number, outputTokens: number) => TokenBudget;
  canMakeRequest: () => boolean;
  tokensRemaining: number;
}

const LLMProviderContext = createContext<LLMProviderContextType>({
  provider: "nvidia",
  setProvider: () => {},
  userKeys: { openrouter: "", nvidia: "" },
  setUserKeys: () => {},
  tokenBudget: {
    totalUsed: 0,
    totalLimit: 150_000,
    dailyUsed: 0,
    dailyLimit: 5_000,
    lastResetDate: "",
  },
  consumeTokensBudget: () => ({
    totalUsed: 0, totalLimit: 150_000, dailyUsed: 0, dailyLimit: 5_000, lastResetDate: "",
  }),
  canMakeRequest: () => true,
  tokensRemaining: 150_000,
});

const STORAGE_KEY = "capstoneai_llm_provider";

async function fetchKeysFromSupabase(): Promise<UserAPIKeys | null> {
  try {
    const res = await fetch('/api/user-keys');
    if (!res.ok) return null;
    const data = await res.json();
    return {
      openrouter: typeof data.keys?.openrouter === 'string' ? data.keys.openrouter : '',
      nvidia: typeof data.keys?.nvidia === 'string' ? data.keys.nvidia : '',
    };
  } catch {
    return null;
  }
}

async function saveKeyToSupabase(provider: string, apiKey: string): Promise<boolean> {
  try {
    if (!apiKey) {
      const res = await fetch('/api/user-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      return res.ok;
    }
    const res = await fetch('/api/user-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function LLMProviderProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<LLMProvider>("nvidia");
  const [userKeys, setUserKeysState] = useState<UserAPIKeys>({ openrouter: "", nvidia: "" });
  const [tokenBudget, setTokenBudget] = useState<TokenBudget>({
    totalUsed: 0, totalLimit: 150_000, dailyUsed: 0, dailyLimit: 5_000, lastResetDate: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "openrouter" || stored === "nvidia") {
        setProviderState(stored);
      }
      setUserKeysState(getUserKeys());
      setTokenBudget(getTokenBudget());
    } catch {}
    setMounted(true);

    // Sync from Supabase in background
    fetchKeysFromSupabase().then((supabaseKeys) => {
      if (supabaseKeys) {
        setUserKeysState(supabaseKeys);
        saveUserKeys(supabaseKeys);
      }
    });
  }, []);

  const setProvider = useCallback((p: LLMProvider) => {
    setProviderState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {}
  }, []);

  const setUserKeys = useCallback((keys: UserAPIKeys) => {
    setUserKeysState(keys);
    saveUserKeys(keys);

    // Sync changed keys to Supabase
    for (const [providerName, apiKey] of Object.entries(keys)) {
      saveKeyToSupabase(providerName, apiKey);
    }
  }, []);

  const consumeTokensBudget = useCallback((inputTokens: number, outputTokens: number) => {
    const updated = consumeTokens(inputTokens, outputTokens);
    setTokenBudget(updated);
    return updated;
  }, []);

  const canMakeRequest = useCallback(() => {
    return canMakeTokenRequest();
  }, []);

  const tokensRemaining = Math.max(0, tokenBudget.totalLimit - tokenBudget.totalUsed);

  return (
    <LLMProviderContext.Provider value={{
      provider, setProvider,
      userKeys, setUserKeys,
      tokenBudget, consumeTokensBudget, canMakeRequest, tokensRemaining,
    }}>
      {children}
    </LLMProviderContext.Provider>
  );
}

export function useLLMProvider() {
  return useContext(LLMProviderContext);
}
