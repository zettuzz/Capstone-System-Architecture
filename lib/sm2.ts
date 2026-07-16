import { StudyCard, StudyCardRow } from '@/types';

const STORAGE_KEY = 'capstoneai_study_cards';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createCard(question: string, answer: string, deck: string = 'default'): StudyCard {
  return {
    id: generateId(),
    question,
    answer,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: 0,
    deck,
  };
}

/**
 * SM-2 algorithm: updates card scheduling based on quality of recall.
 * quality: 0-5 (0=complete blackout, 5=perfect recall)
 */
export function reviewCard(card: StudyCard, quality: number): StudyCard {
  const q = Math.max(0, Math.min(5, quality));

  let { easeFactor, interval, repetitions } = card;

  if (q >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1; // 1 day
    } else if (repetitions === 1) {
      interval = 6; // 6 days
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response — reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    ...card,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReview: Date.now(),
  };
}

export function getCardsForReview(cards: StudyCard[]): StudyCard[] {
  const now = Date.now();
  return cards
    .filter(c => c.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview);
}

export function getAllCards(): StudyCard[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCards(cards: StudyCard[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function addCard(card: StudyCard): void {
  const cards = getAllCards();
  cards.push(card);
  saveCards(cards);
}

export function updateCard(updated: StudyCard): void {
  const cards = getAllCards();
  const idx = cards.findIndex(c => c.id === updated.id);
  if (idx !== -1) {
    cards[idx] = updated;
    saveCards(cards);
  }
}

export function deleteCard(id: string): void {
  const cards = getAllCards().filter(c => c.id !== id);
  saveCards(cards);
}

export function getDecks(): string[] {
  const cards = getAllCards();
  return [...new Set(cards.map(c => c.deck))];
}

export function getCardsByDeck(deck: string): StudyCard[] {
  return getAllCards().filter(c => c.deck === deck);
}

export function getDeckStats(deck: string): { total: number; due: number; mastered: number } {
  const cards = getCardsByDeck(deck);
  const now = Date.now();
  return {
    total: cards.length,
    due: cards.filter(c => c.nextReview <= now).length,
    mastered: cards.filter(c => c.repetitions >= 5).length,
  };
}

// --- DB Sync Functions ---

/* eslint-disable @typescript-eslint/no-explicit-any */
type SupabaseClient = any;

export function rowToCard(row: StudyCardRow): StudyCard {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    easeFactor: row.ease_factor,
    interval: row.interval,
    repetitions: row.repetitions,
    nextReview: row.next_review,
    lastReview: row.last_review,
    deck: row.deck,
  };
}

export function cardToRow(card: StudyCard, userId: string): Omit<StudyCardRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    question: card.question,
    answer: card.answer,
    ease_factor: card.easeFactor,
    interval: card.interval,
    repetitions: card.repetitions,
    next_review: card.nextReview,
    last_review: card.lastReview,
    deck: card.deck,
  };
}

/**
 * Sync localStorage cards to the database.
 * Merges by: if a card ID exists in DB, skip it; otherwise insert.
 * Returns the merged list of all cards (from DB).
 */
export async function syncCardsToDB(supabase: SupabaseClient, userId: string): Promise<StudyCard[]> {
  // Load DB cards
  const { data: dbRows, error: fetchError } = await supabase
    .from('study_cards')
    .select('*');

  if (fetchError) {
    console.warn('Failed to load study cards from DB:', fetchError);
    return getAllCards();
  }

  const dbCards: StudyCard[] = (dbRows || []).map(rowToCard);
  const dbIds = new Set(dbCards.map(c => c.id));

  // Find localStorage cards not in DB
  const localCards = getAllCards();
  const toInsert = localCards
    .filter(c => !dbIds.has(c.id))
    .map(c => cardToRow(c, userId));

  // Insert missing cards to DB
  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('study_cards')
      .insert(toInsert);

    if (insertError) {
      console.warn('Failed to insert study cards to DB:', insertError);
    }
  }

  // Merge: DB cards take precedence, fill in from localStorage for new inserts
  const merged = new Map<string, StudyCard>();
  for (const card of dbCards) {
    merged.set(card.id, card);
  }
  for (const card of localCards) {
    if (!merged.has(card.id)) {
      merged.set(card.id, card);
    }
  }

  const result = Array.from(merged.values());
  // Also update localStorage with merged data
  saveCards(result);
  return result;
}

/**
 * Save a single card to DB (insert or update).
 */
export async function saveCardToDB(supabase: SupabaseClient, card: StudyCard, userId: string): Promise<boolean> {
  const row = cardToRow(card, userId);
  const { error } = await supabase
    .from('study_cards')
    .upsert(
      { id: card.id, ...row },
      { onConflict: 'id' }
    );

  if (error) {
    console.warn('Failed to save study card to DB:', error);
    return false;
  }
  return true;
}

/**
 * Delete a card from DB.
 */
export async function deleteCardFromDB(supabase: SupabaseClient, cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from('study_cards')
    .delete()
    .eq('id', cardId);

  if (error) {
    console.warn('Failed to delete study card from DB:', error);
    return false;
  }
  return true;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
