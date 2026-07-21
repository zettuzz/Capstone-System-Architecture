'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import type { InterviewInstruction, InterviewPhase } from '@/types';
import { useLLMProvider } from '@/components/LLMProviderContext';
import { readSSEStream } from '@/lib/stream';
import { parseInstruction, shouldSuggestNode, extractNodeSuggestion } from '@/lib/instruction-parser';
import { estimateTokensFromMessages } from '@/lib/user-keys';
import { getAndClearSearchContext } from '@/lib/search-context';
import APIKeyPrompt from '@/components/APIKeyPrompt';

const md = new MarkdownIt({ html: false, breaks: true, linkify: true });

const PHASE_LABELS: Record<InterviewPhase, string> = {
  problem: 'Problem',
  system_design: 'System Design',
  tech_assessment: 'Tech Assessment',
  deep_dive: 'Deep Dive',
  research: 'Research',
  complete: 'Complete',
};

interface NodeChatProps {
  nodeId: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  onAddMessage: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  onSuggestNode: (title: string) => void;
  onNodeCreate?: (instruction: InterviewInstruction) => void;
  nodeTitle: string;
  nodeType: 'idea' | 'topic' | 'research' | 'blueprint';
  phase?: InterviewPhase;
  autoMessage?: string;
  readOnly?: boolean;
}

export default function NodeChat({ nodeId, messages, onAddMessage, onSuggestNode, onNodeCreate, nodeTitle, nodeType, phase, autoMessage, readOnly }: NodeChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAPIKeyPrompt, setShowAPIKeyPrompt] = useState(false);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoSentRef = useRef(false);
  const { provider, userKeys, canMakeRequest, consumeTokensBudget, tokenBudget } = useLLMProvider();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (overrideInput?: string, queuedText?: string) => {
    const text = queuedText || overrideInput || input.trim();
    if (!text) return;
    if (isLoading) {
      setMessageQueue(prev => [...prev, text]);
      setInput('');
      return;
    }

    const hasUserKey = !!userKeys[provider];
    if (!hasUserKey && !canMakeRequest()) {
      setShowAPIKeyPrompt(true);
      setMessageQueue([]);
      return;
    }

    const userApiKey = hasUserKey ? userKeys[provider] : undefined;
    const userMsg = { role: 'user' as const, content: text };
    onAddMessage(userMsg);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    const runRequest = async (): Promise<void> => {
      const searchCtx = getAndClearSearchContext();

      let response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: getSystemContext(nodeTitle, nodeType, phase) },
            ...messages,
            userMsg,
          ],
          title: nodeTitle,
          nodeTitle: nodeTitle,
          nodeId: nodeId,
          nodeContext: `This chat is about: ${nodeTitle}`,
          searchContext: searchCtx || undefined,
          provider,
          userApiKey,
        }),
      });

      if (!response.ok) {
        const retryAfter = Number(response.headers.get('retry-after')) || null;
        if (response.status === 429 && !overrideInput) {
          await new Promise((r) => setTimeout(r, (retryAfter || 3) * 1000));
          response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: getSystemContext(nodeTitle, nodeType, phase) },
                ...messages,
                userMsg,
              ],
              title: nodeTitle,
              nodeTitle: nodeTitle,
              nodeId: nodeId,
              nodeContext: `This chat is about: ${nodeTitle}`,
              searchContext: searchCtx || undefined,
              provider,
              userApiKey,
            }),
          });
        }
        if (!response.ok) {
          let message = 'Chat failed. Please try again.';
          try {
            const body = await response.json();
            if (body?.error) message = body.error;
          } catch {}
          if (response.status === 429) {
            const secs = retryAfter ?? 30;
            message = `Rate limit reached — please retry in ${secs}s.`;
          } else if (response.status >= 500) {
            message = 'Server error — please retry.';
          }
          throw new Error(message);
        }
      }

      let fullContent = '';

      for await (const event of readSSEStream(response)) {
        if (event.type === 'error') throw new Error(event.data || 'Stream error');
        if (event.type === 'done') break;
        if (event.type === 'token') {
          const token = event.data;
          if (typeof token === 'string' && token.startsWith('[ERROR]')) {
            throw new Error(token.slice('[ERROR]'.length).trim());
          }
          fullContent += token;
        }
      }

      if (fullContent) {
        if (!hasUserKey) {
          const allMsgsForTokens = [
            { role: 'system', content: getSystemContext(nodeTitle, nodeType, phase) },
            ...messages,
            userMsg,
          ];
          const inputTokens = estimateTokensFromMessages(allMsgsForTokens);
          const outputTokens = Math.ceil((fullContent.split(/\s+/).filter(Boolean).length) * 1.3);
          consumeTokensBudget(inputTokens, outputTokens);
        }

        const { clean, instruction } = parseInstruction(fullContent);

        onAddMessage({ role: 'assistant', content: clean });

        if (instruction && onNodeCreate) {
          onNodeCreate(instruction);
        }

        if (!instruction && shouldSuggestNode(fullContent, messages)) {
          const suggestedTitle = extractNodeSuggestion(fullContent);
          if (suggestedTitle) {
            onSuggestNode(suggestedTitle);
          }
        }
      }
    };

    try {
      await runRequest();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection error. Please try again.';
      console.error('Chat error:', err);
      onAddMessage({ role: 'assistant', content: message });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, nodeTitle, nodeType, phase, onAddMessage, onSuggestNode, onNodeCreate, provider, userKeys, canMakeRequest, consumeTokensBudget, nodeId]);

  useEffect(() => {
    if (!isLoading && messageQueue.length > 0) {
      const next = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));
      sendMessage(undefined, next);
    }
  }, [isLoading, messageQueue, sendMessage]);

  useEffect(() => {
    if (autoMessage && !autoSentRef.current && messages.length === 0) {
      autoSentRef.current = true;
      sendMessage(autoMessage);
    }
  }, [autoMessage, messages.length, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSearch = async () => {
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${query} ${nodeTitle}`, maxResults: 3 }),
      });

      const data = await res.json();
      if (data.results?.results?.length > 0) {
        const snippet = data.results.results
          .map((r: { title: string; url: string; content: string }) =>
            `**${r.title}** (${r.url})\n${r.content}`
          )
          .join('\n\n');

        onAddMessage({
          role: 'assistant',
          content: `## Search Results\n\n${snippet}\n\nWould you like me to analyze these results?`
        });
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {phase && (
        <div className="px-3 py-1.5 border-b border-surface-border flex items-center gap-2">
          <div className={`phase-dot phase-${phase}`} />
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
            {PHASE_LABELS[phase]}
          </span>
        </div>
      )}

      {tokenBudget.dailyUsed > 0 && tokenBudget.dailyUsed < tokenBudget.dailyLimit && !userKeys[provider] && (
        <div className="px-3 py-1 border-b border-surface-border">
          <p className="text-[9px] font-mono text-text-muted">
            {tokenBudget.dailyLimit - tokenBudget.dailyUsed} tokens left today
          </p>
        </div>
      )}

      <div ref={scrollRef} className="node-chat-area nodrag nopan nowheel p-3 space-y-3 min-h-[120px] max-h-[300px]" onWheel={(e) => e.stopPropagation()}>
        {messages.length === 0 && (
          <p className="text-text-muted text-[11px] font-mono text-center py-4">
            Start a conversation about {nodeTitle}...
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              {msg.role === 'assistant' && (
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  AI
                </span>
              )}
              <div
                className={`text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-text-main'
                    : 'prose-terminal text-text-main'
                }`}
                dangerouslySetInnerHTML={{
                  __html: msg.role === 'assistant'
                    ? md.render(msg.content)
                    : msg.content
                }}
              />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {!readOnly ? (
        <div className="p-3 border-t border-surface-border">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="nodrag nopan flex-1 bg-surface-highlight text-text-main text-[13px] font-mono p-2 border border-surface-border focus:border-white/30 outline-none resize-none placeholder:text-text-muted"
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="px-2 py-1 bg-white text-black text-[11px] font-mono font-bold disabled:opacity-30 hover:bg-neutral-200 transition-colors"
              >
                EXE
              </button>
              <button
                onClick={handleSearch}
                disabled={!input.trim() || isLoading}
                className="px-2 py-1 border border-surface-border text-text-muted text-[10px] font-mono disabled:opacity-30 hover:border-white/30 hover:text-text-main transition-colors"
                title="Search web"
              >
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 20" }}>
                  search
                </span>
              </button>
            </div>
          </div>
          {messageQueue.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5 px-1">
              <span className="text-[9px] font-mono text-text-muted">
                {messageQueue.length} queued
              </span>
              <button
                onClick={() => setMessageQueue([])}
                className="text-[9px] font-mono text-text-muted hover:text-white transition-colors"
              >
                [clear]
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="px-3 py-2 border-t border-surface-border">
          {phase === 'complete' ? (
            <p className="text-[10px] font-mono text-text-muted text-center">
              Project complete — interview finished
            </p>
          ) : (
            <p className="text-[10px] font-mono text-text-muted text-center">
              Reference content — edit in the root idea node
            </p>
          )}
        </div>
      )}

      {showAPIKeyPrompt && (
        <APIKeyPrompt onClose={() => setShowAPIKeyPrompt(false)} blockedProvider={provider} />
      )}
    </div>
  );
}

function getSystemContext(nodeTitle: string, nodeType: string, phase?: InterviewPhase): string {
  const baseContext = `You are CapstoneAI, a friendly senior student helping a beginner with their capstone project.
Current topic: "${nodeTitle}" (type: ${nodeType})

## Your Personality
- Warm, casual, encouraging — use "we" language ("What are we building?")
- Keep every response to 2-3 sentences max
- Say "app" not "application", "build" not "develop", "free" not "open-source"
- If the student seems confused, give examples to help them understand

## Rules
- ONE question per response. Never bundle questions.
- Brief acknowledgment before the next question. Example: "Nice! A web app for booking courts. How many people are on your team?"
- If the student's answer is vague, gently ask for more detail before moving on
- Never produce tables, roadmaps, multi-section analyses, or numbered lists with sub-items
- Never ask about resource allocation, bottleneck analysis, or development tracks
- Only suggest FREE tools — Web app → Next.js + Supabase + Tailwind CSS + Vercel; Mobile app → React Native (Expo) + Supabase; Desktop app → Electron + Supabase; Hybrid → Next.js + React Native + Supabase; Firebase is a good alternative for real-time apps
- If the student writes in Filipino, respond in Filipino
- Only create a node when you have gathered ALL required information for that topic
- If any part is missing or vague, ask a follow-up WITHOUT creating a node
- Only reference search results if directly relevant. If low quality, say "I didn't find much" and move on.`;

  if (phase) {
    return `${baseContext}\nInterview phase: ${phase}. Ask questions appropriate for this phase.`;
  }

  if (nodeType === 'research') {
    return `${baseContext}\nThis is a research node. Analyze findings briefly (1-2 sentences max) and suggest next steps.`;
  }

  if (nodeType === 'topic') {
    return `${baseContext}\nThis is a sub-topic. Provide specific guidance for this area.`;
  }

  return baseContext;
}
