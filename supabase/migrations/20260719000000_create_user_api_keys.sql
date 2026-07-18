-- Encrypted API keys per user, per provider
CREATE TABLE IF NOT EXISTS user_api_keys (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider   TEXT NOT NULL CHECK (provider IN ('openrouter', 'nvidia')),
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- RLS: users can only read/write their own keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own API keys"
  ON user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON user_api_keys FOR DELETE
  USING (auth.uid() = user_id);
