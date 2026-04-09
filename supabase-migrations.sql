-- =============================================
-- Uppy Map — Fix submissions + leaderboard tables
-- Run in Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Add missing columns to submissions table
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS store_id integer,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 2. Add missing column to leaderboard table
ALTER TABLE public.leaderboard
  ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;

-- 3. Enable RLS on submissions (if not already)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for submissions
-- Users can insert their own submissions
CREATE POLICY IF NOT EXISTS "Users can insert own submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own submissions
CREATE POLICY IF NOT EXISTS "Users can read own submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'submissions'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'leaderboard'
ORDER BY ordinal_position;
