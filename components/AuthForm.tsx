'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthForm({ initialMode = 'login' }: { initialMode?: 'login' | 'signup' }) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      router.push('/chat');
    } else {
      setError(data.error || 'Authentication failed');
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div className="sharp-panel p-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 0 'wght' 400 'GRAD' 0 'opsz' 24" }}>
            terminal
          </span>
          <h1 className="text-transparent bg-clip-text bg-gradient-to-b from-white to-[#666666] text-2xl font-bold font-display">
            CAPSTONE TERMINAL
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="sharp-panel p-4 border border-[#ff0000]/50 bg-[#ff0000]/10">
              <p className="text-[13px] font-mono text-[#ff6666]">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.1em] text-text-muted mb-2">
              Email
            </label>
            <div className="sharp-panel sharp-input rounded-none flex items-center px-4 min-h-[48px]">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full bg-transparent text-text-main placeholder:text-text-muted border-none focus:ring-0 p-0 font-mono text-[14px] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-[0.1em] text-text-muted mb-2">
              Password
            </label>
            <div className="sharp-panel sharp-input rounded-none flex items-center px-4 min-h-[48px]">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full bg-transparent text-text-main placeholder:text-text-muted border-none focus:ring-0 p-0 font-mono text-[14px] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sharp-panel sharp-input rounded-none flex items-center justify-center px-4 min-h-[48px] text-text-main font-mono font-bold text-[13px] uppercase tracking-[0.1em] hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'LOGIN' : 'SIGN UP'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[11px] font-mono text-text-muted hover:text-white transition-colors"
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}