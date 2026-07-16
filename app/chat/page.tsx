'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatBox from '@/components/ChatBox';
import type { ChatBoxHandle } from '@/components/ChatBox';
import EvaluateButton from '@/components/EvaluateButton';

function ChatContent() {
  const searchParams = useSearchParams();
  const idea = searchParams.get('idea') || 'AI Study Planner';
  const initialMessage = searchParams.get('msg') || '';
  const chatBoxRef = useRef<ChatBoxHandle>(null);
  const [evaluating, setEvaluating] = useState(false);

  const handleEvaluate = async () => {
    setEvaluating(true);
    chatBoxRef.current?.handleEvaluate();
    setTimeout(() => setEvaluating(false), 2000);
  };

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <EvaluateButton onClick={handleEvaluate} loading={evaluating} />
        <ChatBox ref={chatBoxRef} title={idea} initialMessage={initialMessage} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="bg-background-dark h-screen" />}>
      <ChatContent />
    </Suspense>
  );
}
