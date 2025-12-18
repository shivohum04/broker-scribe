# User Limits Migration

## Issue: 404 Error for user_limits table

If you're seeing 404 errors for `user_limits` queries, it means the migration hasn't been applied yet.

## Solution

### Option 1: Apply Migration via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `20250124000001_create_user_limits.sql`
4. Paste and run the SQL in the SQL Editor

### Option 2: Apply Migration via Supabase CLI

If you have Supabase CLI set up:

```bash
supabase db push
```

Or apply the specific migration:

```bash
supabase migration up
```

### Option 3: Manual SQL Execution

Run this SQL in your Supabase SQL Editor:

```sql
-- Create user_limits table for per-user configurable limits
CREATE TABLE IF NOT EXISTS public.user_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  max_properties INTEGER NOT NULL DEFAULT 70,
  max_media_per_property INTEGER NOT NULL DEFAULT 10,
  max_videos_per_property INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own limits
CREATE POLICY "Users can read their own limits"
  ON public.user_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own limits (for initial creation)
CREATE POLICY "Users can insert their own limits"
  ON public.user_limits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own limits
CREATE POLICY "Users can update their own limits"
  ON public.user_limits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON public.user_limits(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_limits_updated_at
  BEFORE UPDATE ON public.user_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_limits_updated_at();
```

## Temporary Workaround

The code has been updated to gracefully handle the missing table by:
- Returning default limits (70 properties, 10 media, 1 video) when the table doesn't exist
- Logging warnings instead of throwing errors
- Allowing the app to function normally with default limits

**Note:** Once the migration is applied, the app will automatically start using per-user limits from the database.

## Verifying the Migration

After applying the migration, you can verify it worked by:

1. Checking the table exists:
```sql
SELECT * FROM public.user_limits LIMIT 1;
```

2. The 404 errors should stop appearing in the console
3. User-specific limits will be created automatically on first access


