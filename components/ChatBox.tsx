'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Message } from '@/types';
import { useRouter } from 'next/navigation';
import MarkdownIt from 'markdown-it';

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
  const reader = response.body?.getReader();
  if (!reader) return onError('No response body');
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('0:')) {
          const data = line.slice(2);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            onToken(JSON.parse(data));
          } catch {
            // skip malformed
          }
        } else if (line.startsWith('3:')) {
          onError(line.slice(2));
          return;
        }
      }
    }
    onDone();
  } catch (err) {
    onError(String(err));
  }
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const fetchStream = useCallback(async (
    chatMessages: { role: string; content: string }[],
    onSuccess: (content: string) => void,
    onFallback: () => void
  ) => {
    setLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatMessages, title }),
      });

      let fullContent = '';

      await readStream(
        response,
        (token) => {
          fullContent += token;
          setStreamingContent(fullContent);
        },
        () => {
          onSuccess(fullContent);
          setLoading(false);
          setIsStreaming(false);
          setStreamingContent('');
        },
        () => {
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
  }, []);

  useEffect(() => {
    const initChat = async () => {
      if (initialMessage) {
        const userMsg: Message = { role: 'user', content: initialMessage };
        setMessages([userMsg]);

        await fetchStream(
          [
            { role: 'user', content: initialMessage }
          ],
          (content) => setMessages([userMsg, { role: 'assistant', content }]),
          () => setMessages([userMsg, { role: 'assistant', content: `Got it — "${initialMessage}". Tell me more about what you're envisioning for this capstone.` }])
        );
      } else {
        await fetchStream(
          [],
          (content) => setMessages([{ role: 'assistant', content }]),
          () => setMessages([{ role: 'assistant', content: `Welcome to CapstoneAI! I'm your thesis adviser. Let's start with your project idea. What problem do you want to solve with your capstone?` }])
        );
      }
    };
    initChat();
  }, [title, initialMessage, fetchStream]);

  const sendMessage = async (searchContext?: string) => {
    if (!input.trim() && !searchContext) return;
    if (isStreaming) return;

    let userMessage: Message;
    let newMessages: Message[];

    if (searchContext) {
      userMessage = { role: 'user', content: `[Search results for similar systems]:\n\n${searchContext}\n\nPlease analyze these results and tell me what systems already exist, what's novel, and what gaps remain.` };
      newMessages = [...messages, userMessage];
    } else {
      userMessage = { role: 'user', content: input };
      newMessages = [...messages, userMessage];
      setInput('');
    }

    setMessages(newMessages);

    await fetchStream(
      newMessages.map(m => ({ role: m.role, content: m.content })),
      (content) => {
        setMessages([...newMessages, { role: 'assistant', content }]);

        if (!searchContext && containsSearchIntent(content)) {
          triggerSearch(newMessages);
        }
      },
      () => setMessages([...newMessages, { role: 'assistant', content: 'Error connecting to AI service. Please try again.' }])
    );
  };

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
    setLoading(true);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          title
        }),
      });

      const data = await response.json();

      const exportResponse = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation: data.evaluation,
          messages: messages
        }),
      });

      const exportData = await exportResponse.json();

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
                  dangerouslySetInnerHTML={{ __html: md.render(streamingContent) }}
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
              placeholder={isStreaming ? "AI is responding..." : "Refine the idea or ask for suggestions..."}
              rows={1}
              disabled={isStreaming}
              className="w-full bg-transparent text-text-main placeholder:text-text-muted border-none focus:ring-0 p-0 py-4 font-mono text-[14px] leading-tight outline-none resize-none overflow-hidden block disabled:opacity-50"
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
      </div>
    </div>
  );
});

ChatBox.displayName = 'ChatBox';

export default ChatBox;
