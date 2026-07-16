'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { StudyCard } from '@/types';
import {
  getAllCards,
  addCard,
  deleteCard,
  createCard,
  reviewCard,
  getCardsForReview,
  getDecks,
  getDeckStats,
  syncCardsToDB,
  saveCardToDB,
  deleteCardFromDB,
} from '@/lib/sm2';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const QUALITY_LABELS = [
  { value: 0, label: 'Blackout', color: 'bg-red-500' },
  { value: 1, label: 'Wrong', color: 'bg-red-400' },
  { value: 2, label: 'Hard', color: 'bg-orange-400' },
  { value: 3, label: 'Good', color: 'bg-yellow-400' },
  { value: 4, label: 'Easy', color: 'bg-green-400' },
  { value: 5, label: 'Perfect', color: 'bg-green-500' },
];

export default function StudyPage() {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [decks, setDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [mode, setMode] = useState<'browse' | 'review' | 'add'>('browse');
  const [reviewQueue, setReviewQueue] = useState<StudyCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newDeck, setNewDeck] = useState('general');

  const [synced, setSynced] = useState(false);

  const refresh = useCallback(async () => {
    const all = getAllCards();
    setCards(all);
    setDecks(getDecks());

    // Sync to DB if user is authenticated (once per session)
    if (!synced) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const merged = await syncCardsToDB(supabase, user.id);
          setCards(merged);
          setDecks([...new Set(merged.map(c => c.deck))]);
        }
      } catch {
        // Sync failed, use localStorage only
      }
      setSynced(true);
    }
  }, [synced]);

  useEffect(() => { refresh(); }, [refresh]);

  const dueCount = selectedDeck === 'all'
    ? cards.filter(c => c.nextReview <= Date.now()).length
    : cards.filter(c => c.deck === selectedDeck && c.nextReview <= Date.now()).length;

  const startReview = () => {
    const pool = selectedDeck === 'all' ? cards : cards.filter(c => c.deck === selectedDeck);
    const due = getCardsForReview(pool);
    if (due.length === 0) return;
    setReviewQueue(due);
    setCurrentIdx(0);
    setShowAnswer(false);
    setMode('review');
  };

  const handleQuality = async (quality: number) => {
    const card = reviewQueue[currentIdx];
    const updated = reviewCard(card, quality);

    const all = getAllCards();
    const idx = all.findIndex(c => c.id === card.id);
    if (idx !== -1) {
      all[idx] = updated;
      localStorage.setItem('capstoneai_study_cards', JSON.stringify(all));
    }

    // Persist to DB if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveCardToDB(supabase, updated, user.id);
      }
    } catch {
      // DB sync failed, localStorage is still updated
    }

    if (currentIdx < reviewQueue.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowAnswer(false);
    } else {
      refresh();
      setMode('browse');
    }
  };

  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const card = createCard(newQuestion.trim(), newAnswer.trim(), newDeck.trim() || 'general');
    addCard(card);

    // Persist to DB if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveCardToDB(supabase, card, user.id);
      }
    } catch {
      // DB sync failed, localStorage is still updated
    }

    setNewQuestion('');
    setNewAnswer('');
    refresh();
    setMode('browse');
  };

  const handleDelete = async (id: string) => {
    deleteCard(id);

    // Persist to DB if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await deleteCardFromDB(supabase, id);
      }
    } catch {
      // DB sync failed, localStorage is still updated
    }

    refresh();
  };

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 border-b border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-2xl font-bold font-display">
                Spaced Repetition
              </h1>
              <p className="text-text-muted font-mono text-xs mt-1">
                SM-2 algorithm — review at optimal intervals
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('add')}
                className="px-4 py-2 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
              >
                + Add Card
              </button>
              <button
                onClick={startReview}
                disabled={dueCount === 0}
                className="px-4 py-2 bg-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-white/10"
              >
                Review ({dueCount} due)
              </button>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDeck('all')}
              className={`px-3 py-1 font-mono text-xs border transition-colors ${
                selectedDeck === 'all'
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-text-muted border-white/10 hover:border-white/30'
              }`}
            >
              All ({cards.length})
            </button>
            {decks.map(deck => {
              const stats = getDeckStats(deck);
              return (
                <button
                  key={deck}
                  onClick={() => setSelectedDeck(deck)}
                  className={`px-3 py-1 font-mono text-xs border transition-colors ${
                    selectedDeck === deck
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-text-muted border-white/10 hover:border-white/30'
                  }`}
                >
                  {deck} ({stats.total})
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'add' && (
            <div className="max-w-[600px] mx-auto space-y-4">
              <h2 className="text-text-main font-display text-lg font-bold">New Card</h2>
              <input
                value={newDeck}
                onChange={e => setNewDeck(e.target.value)}
                placeholder="Deck name (e.g. 'react', 'databases')"
                className="w-full bg-surface/50 text-text-main font-mono text-sm p-3 border border-surface-border focus:border-white/30 outline-none"
              />
              <textarea
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="Question"
                rows={3}
                className="w-full bg-surface/50 text-text-main font-mono text-sm p-3 border border-surface-border focus:border-white/30 outline-none resize-none"
              />
              <textarea
                value={newAnswer}
                onChange={e => setNewAnswer(e.target.value)}
                placeholder="Answer"
                rows={3}
                className="w-full bg-surface/50 text-text-main font-mono text-sm p-3 border border-surface-border focus:border-white/30 outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                >
                  Save Card
                </button>
                <button
                  onClick={() => setMode('browse')}
                  className="px-4 py-2 bg-white/10 text-text-muted font-mono text-xs uppercase tracking-wider hover:bg-white/20 transition-colors border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'review' && reviewQueue.length > 0 && (
            <div className="max-w-[600px] mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-mono text-xs">
                  Card {currentIdx + 1} of {reviewQueue.length}
                </span>
                <button
                  onClick={() => setMode('browse')}
                  className="text-text-muted font-mono text-xs hover:text-text-main transition-colors"
                >
                  EXIT REVIEW
                </button>
              </div>

              <div className="sharp-panel p-8">
                <p className="text-text-muted font-mono text-[11px] uppercase tracking-widest mb-4">Question</p>
                <p className="text-text-main text-lg leading-relaxed">{reviewQueue[currentIdx].question}</p>
              </div>

              {showAnswer ? (
                <>
                  <div className="sharp-panel p-8 border-white/20">
                    <p className="text-text-muted font-mono text-[11px] uppercase tracking-widest mb-4">Answer</p>
                    <p className="text-text-main text-lg leading-relaxed">{reviewQueue[currentIdx].answer}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-text-muted font-mono text-[11px] uppercase tracking-widest">How well did you know it?</p>
                    <div className="flex gap-2">
                      {QUALITY_LABELS.map(q => (
                        <button
                          key={q.value}
                          onClick={() => handleQuality(q.value)}
                          className="flex-1 py-3 font-mono text-xs font-bold uppercase tracking-wider text-black hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: q.value <= 2 ? '#ef4444' : q.value <= 3 ? '#eab308' : '#22c55e' }}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-4 bg-white/5 border border-white/10 text-text-main font-mono text-sm uppercase tracking-wider hover:bg-white/10 transition-colors"
                >
                  Show Answer
                </button>
              )}
            </div>
          )}

          {mode === 'browse' && (
            <div className="space-y-3">
              {cards.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-text-muted font-mono text-sm">No cards yet. Add your first card to start studying.</p>
                </div>
              ) : (
                cards
                  .filter(c => selectedDeck === 'all' || c.deck === selectedDeck)
                  .map(card => (
                    <div key={card.id} className="sharp-panel p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted px-2 py-0.5 bg-white/5 border border-white/10">
                            {card.deck}
                          </span>
                          {card.repetitions >= 5 && (
                            <span className="font-mono text-[10px] uppercase tracking-widest text-green-400 px-2 py-0.5 bg-green-500/10 border border-green-500/20">
                              mastered
                            </span>
                          )}
                          {card.nextReview <= Date.now() && (
                            <span className="font-mono text-[10px] uppercase tracking-widest text-orange-400 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20">
                              due
                            </span>
                          )}
                        </div>
                        <p className="text-text-main text-sm font-medium truncate">{card.question}</p>
                        <p className="text-text-muted text-xs mt-1 truncate">{card.answer}</p>
                        <p className="text-text-muted font-mono text-[10px] mt-2">
                          EF: {card.easeFactor.toFixed(2)} · Interval: {card.interval}d · Reps: {card.repetitions}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="text-text-muted hover:text-red-400 transition-colors shrink-0 p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
