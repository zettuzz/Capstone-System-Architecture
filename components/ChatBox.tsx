'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Message } from '@/types';
import { useRouter } from 'next/navigation';
import MarkdownIt from 'markdown-it';
import { useLLMProvider } from '@/components/LLMProviderContext';
import { readSSEStream } from '@/lib/stream';
import APIKeyPrompt from '@/components/APIKeyPrompt';
import { estimateTokensFromMessages } from '@/lib/user-keys';
import { parseInstruction } from '@/lib/instruction-parser';

const md = new MarkdownIt({ html: false, breaks: true, linkify: true });

interface ChatBoxProps {
  title: string;
  initialMessage?: string;
}

export interface ChatBoxHandle {
  handleEvaluate: () => void;
}

async function readStream(
  response: Response,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void
) {
  for await (const event of readSSEStream(response)) {
    if (event.type === 'token') onToken(event.data!);
    else if (event.type === 'done') { onDone(); return; }
    else if (event.type === 'error') { onError(event.data!); return; }
  }
  onDone();
}

const SEARCH_KEYWORDS = [
  'similar system', 'similar existing', 'search the web', 'web search',
  'existing system', 'already exists', 'existing solution', 'existing project',
  'similar project', 'similar capstone'
];

function containsSearchIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return SEARCH_KEYWORDS.some(kw => lower.includes(kw));
}

function extractSearchQuery(messages: { role: string; content: string }[]): string {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  return lastUserMsg?.content || 'similar capstone projects Philippines';
}

const ChatBox = forwardRef<ChatBoxHandle, ChatBoxProps>(({ title, initialMessage = '' }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAPIKeyPrompt, setShowAPIKeyPrompt] = useState(false);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { provider, userKeys, canMakeRequest, consumeTokensBudget, tokenBudget } = useLLMProvider();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const prepareRequest = useCallback(() => {
    return { userApiKey: !!userKeys[provider] ? userKeys[provider] : undefined };
  }, [userKeys, provider]);

  const fetchStream = useCallback(async (
    chatMessages: { role: string; content: string }[],
    onSuccess: (content: string) => void,
    onFallback: () => void
  ) => {
    if (!canMakeRequest()) {
      setShowAPIKeyPrompt(true);
      setLoading(false);
      setIsStreaming(false);
      setMessageQueue([]);
      return;
    }

    const { userApiKey } = prepareRequest();
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages, title, provider, userApiKey }),
      });

      let fullContent = '';

      await readStream(
        response,
        (token) => {
          fullContent += token;
          setStreamingContent(fullContent);
        },
        () => {
          if (!userApiKey) {
            const inputTokens = estimateTokensFromMessages(chatMessages);
            const outputTokens = Math.ceil((fullContent.split(/\s+/).filter(Boolean).length) * 1.3);
            consumeTokensBudget(inputTokens, outputTokens);
          }
          onSuccess(fullContent);
          setLoading(false);
          setIsStreaming(false);
          setStreamingContent('');
        },
        () => {
          if (!userApiKey && fullContent) {
            const inputTokens = estimateTokensFromMessages(chatMessages);
            const outputTokens = Math.ceil((fullContent.split(/\s+/).filter(Boolean).length) * 1.3);
            consumeTokensBudget(inputTokens, outputTokens);
          }
          onSuccess(fullContent || 'Response interrupted. Please try again.');
          setLoading(false);
          setIsStreaming(false);
          setStreamingContent('');
        }
      );
    } catch {
      onFallback();
      setLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [canMakeRequest, prepareRequest, title, provider, consumeTokensBudget]);

  useEffect(() => {
    const initChat = async () => {
      if (initialMessage) {
        const userMsg: Message = { role: 'user', content: initialMessage };
        setMessages([userMsg]);

        await fetchStream(
          [
            { role: 'user', content: initialMessage }
          ],
          (content) => setMessages([userMsg, { role: 'assistant', content: parseInstruction(content).clean }]),
          () => setMessages([userMsg, { role: 'assistant', content: `Got it — "${initialMessage}". Tell me more about what you're envisioning for this capstone.` }])
        );
      } else {
        await fetchStream(
          [],
          (content) => setMessages([{ role: 'assistant', content: parseInstruction(content).clean }]),
          () => setMessages([{ role: 'assistant', content: `Welcome to CapstoneAI! I'm your thesis adviser. Let's start with your project idea. What problem do you want to solve with your capstone?` }])
        );
      }
    };
    initChat();
  }, [title, initialMessage, fetchStream]);

  const sendMessage = async (searchContext?: string, queuedText?: string) => {
    const textToSend = queuedText || input.trim();
    if (!textToSend && !searchContext) return;
    if (isStreaming) {
      if (!searchContext && textToSend) {
        setMessageQueue(prev => [...prev, textToSend]);
        setInput('');
      }
      return;
    }

    let userMessage: Message;
    let newMessages: Message[];

    if (searchContext) {
      userMessage = { role: 'user', content: `[Search results for similar systems]:\n\n${searchContext}\n\nPlease analyze these results and tell me what systems already exist, what's novel, and what gaps remain.` };
      newMessages = [...messages, userMessage];
    } else {
      userMessage = { role: 'user', content: textToSend };
      newMessages = [...messages, userMessage];
      setInput('');
    }

    setMessages(newMessages);

    await fetchStream(
      newMessages.map(m => ({ role: m.role, content: m.content })),
      (content) => {
        setMessages([...newMessages, { role: 'assistant', content: parseInstruction(content).clean }]);

        if (!searchContext && containsSearchIntent(content)) {
          triggerSearch(newMessages);
        }
      },
      () => setMessages([...newMessages, { role: 'assistant', content: 'Error connecting to AI service. Please try again.' }])
    );
  };

  useEffect(() => {
    if (!isStreaming && !loading && messageQueue.length > 0) {
      const next = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));
      sendMessage(undefined, next);
    }
  }, [isStreaming, loading, messageQueue, sendMessage]);

  const triggerSearch = async (currentMessages: Message[]) => {
    const query = extractSearchQuery(currentMessages.map(m => ({ role: m.role, content: m.content })));

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, maxResults: 5 }),
      });

      const data = await res.json();
      const results = data.results;

      if (results?.results?.length > 0) {
        const searchSnippet = results.results
          .map((r: { title: string; url: string; content: string }) =>
            `**${r.title}** (${r.url})\n${r.content}`
          )
          .join('\n\n');

        await sendMessage(searchSnippet);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleEvaluate = async () => {
    if (!canMakeRequest()) {
      setShowAPIKeyPrompt(true);
      return;
    }

    const { userApiKey } = prepareRequest();
    setLoading(true);
    try {
      const inputMsgs = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: inputMsgs,
          title,
          provider,
          userApiKey,
        }),
      });

      const data = await response.json();

      if (!userApiKey) {
        const inputTokens = estimateTokensFromMessages(inputMsgs);
        const outputTokens = Math.ceil((JSON.stringify(data.evaluation || '').split(/\s+/).filter(Boolean).length) * 1.3);
        consumeTokensBudget(inputTokens, outputTokens);
      }

      const exportResponse = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation: data.evaluation,
          messages: messages,
          provider,
          userApiKey,
        }),
      });

      const exportData = await exportResponse.json();

      if (!userApiKey) {
        const exportInputTokens = estimateTokensFromMessages(inputMsgs) + Math.ceil((JSON.stringify(data.evaluation || '').split(/\s+/).filter(Boolean).length) * 1.3);
        const exportOutputTokens = Math.ceil((exportData.markdown || '').split(/\s+/).filter(Boolean).length * 1.3);
        consumeTokensBudget(exportInputTokens, exportOutputTokens);
      }

      const params = new URLSearchParams();
      params.set('evaluation', JSON.stringify(data.evaluation));
      params.set('markdown', encodeURIComponent(exportData.markdown));
      if (exportData.schedule && exportData.schedule.length > 0) {
        params.set('schedule', encodeURIComponent(JSON.stringify(exportData.schedule)));
      }

      router.push(`/result?${params.toString()}`);
    } catch {
      console.error('Evaluation failed');
    }
    setLoading(false);
  };

  useImperativeHandle(ref, () => ({ handleEvaluate }));

  return (
    <div className="w-full h-full flex flex-col relative font-body selection:bg-white selection:text-black overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-none sharp-panel flex items-center justify-center shrink-0 text-white mt-0.5">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>smart_toy</span>
              </div>
            )}

            <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
              {msg.role === 'assistant' && (
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">Terminal_AI</span>
              )}
              <div className={`${msg.role === 'user' ? 'sharp-panel p-4' : ''}`}>
                {msg.role === 'assistant' ? (
                  <div
                    className="prose-terminal text-text-main leading-relaxed text-[15px]"
                    dangerouslySetInnerHTML={{ __html: md.render(msg.content) }}
                  />
                ) : (
                  <p className="text-text-main leading-relaxed text-[15px]">{msg.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-none sharp-panel flex items-center justify-center shrink-0 text-white">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>smart_toy</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">Terminal_AI</span>
              {streamingContent ? (
                <div
                  className="prose-terminal text-text-main leading-relaxed text-[15px]"
                  dangerouslySetInnerHTML={{ __html: md.render(parseInstruction(streamingContent).clean) }}
                />
              ) : (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}
            </div>
          </div>
        )}

        {loading && !isStreaming && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-none sharp-panel flex items-center justify-center shrink-0 text-white">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>smart_toy</span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">Terminal_AI</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full p-6 bg-background-dark border-t border-surface-border">
        <div className="relative w-full group">
          <div className="sharp-panel sharp-input rounded-none flex items-center w-full transition-all duration-200 min-h-[56px] px-4">
            <span aria-hidden="true" className="material-symbols-outlined text-text-muted mr-3 select-none" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
              terminal
            </span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={isStreaming ? "AI is responding — type to queue..." : "Refine the idea or ask for suggestions..."}
              rows={1}
              className="w-full bg-transparent text-text-main placeholder:text-text-muted border-none focus:ring-0 p-0 py-4 font-mono text-[14px] leading-tight outline-none resize-none overflow-hidden block"
            />
            <div className="ml-3 flex items-center gap-3">
              <button
                onClick={() => sendMessage()}
                disabled={isStreaming}
                className="hidden sm:flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-200 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <span className="text-[11px] font-mono text-text-muted uppercase tracking-[0.05em] flex items-center gap-1 bg-white/5 px-2 py-1 rounded-none border border-white/10 whitespace-nowrap">
                  EXE
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 600 'GRAD' 0 'opsz' 20" }}>
                    keyboard_return
                  </span>
                </span>
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={isStreaming}
                className="w-8 h-8 flex items-center justify-center rounded-none bg-white hover:bg-neutral-200 text-black transition-colors duration-200 shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 0 'wght' 700 'GRAD' 0 'opsz' 20" }}>arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
        {messageQueue.length > 0 && (
          <div className="flex items-center gap-2 mt-1.5 px-1">
            <span className="text-[10px] font-mono text-text-muted">
              {messageQueue.length} queued
            </span>
            <button
              onClick={() => setMessageQueue([])}
              className="text-[10px] font-mono text-text-muted hover:text-white transition-colors"
            >
              [clear]
            </button>
          </div>
        )}
      </div>

      {tokenBudget.dailyUsed > 0 && tokenBudget.dailyUsed < tokenBudget.dailyLimit && !userKeys[provider] && (
        <div className="absolute top-2 right-2 z-10">
          <p className="text-[10px] font-mono text-text-muted bg-surface/80 px-2 py-1 border border-surface-border">
            {tokenBudget.dailyLimit - tokenBudget.dailyUsed} tokens left today
          </p>
        </div>
      )}

      {showAPIKeyPrompt && (
        <APIKeyPrompt onClose={() => setShowAPIKeyPrompt(false)} blockedProvider={provider} />
      )}
    </div>
  );
});

ChatBox.displayName = 'ChatBox';

export default ChatBox;
