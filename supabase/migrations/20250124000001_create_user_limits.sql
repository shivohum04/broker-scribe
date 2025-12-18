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

-- Policy: Users can update their own limits (though typically this would be admin-only)
-- For now, allow users to update their own limits
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

-- Optional: Create a function to get or create user limits with defaults
-- This can be called from the application layer if needed
CREATE OR REPLACE FUNCTION get_or_create_user_limits(p_user_id UUID)
RETURNS public.user_limits AS $$
DECLARE
  v_limits public.user_limits;
BEGIN
  -- Try to get existing limits
  SELECT * INTO v_limits
  FROM public.user_limits
  WHERE user_id = p_user_id;

  -- If not found, create with defaults
  IF v_limits IS NULL THEN
    INSERT INTO public.user_limits (user_id, max_properties, max_media_per_property, max_videos_per_property)
    VALUES (p_user_id, 70, 10, 1)
    RETURNING * INTO v_limits;
  END IF;

  RETURN v_limits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


