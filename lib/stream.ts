export interface SSEEvent {
  type: 'token' | 'done' | 'error';
  data?: string;
}

export async function* readSSEStream(response: Response): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader();
  if (!reader) return;
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
            yield { type: 'done' };
            return;
          }
          try {
            yield { type: 'token', data: JSON.parse(data) };
          } catch {
            // skip malformed
          }
        } else if (line.startsWith('3:')) {
          yield { type: 'error', data: line.slice(2) };
          return;
        }
      }
    }
    yield { type: 'done' };
  } catch (err) {
    yield { type: 'error', data: String(err) };
  }
}
