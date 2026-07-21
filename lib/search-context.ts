let pendingSearchContext: string | null = null;

export function setSearchContext(context: string | null) {
  pendingSearchContext = context;
}

export function getAndClearSearchContext(): string | null {
  const ctx = pendingSearchContext;
  pendingSearchContext = null;
  return ctx;
}
