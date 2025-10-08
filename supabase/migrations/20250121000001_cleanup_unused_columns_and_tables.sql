-- Database cleanup migration
-- Remove unused columns and tables

-- Step 1: Remove unused thumbnail_urls column from properties table
-- This column was created for a thumbnail system that was never implemented
-- The current system uses cover_thumbnail_url instead

-- First, drop the trigger that automatically updates thumbnail_urls
DROP TRIGGER IF EXISTS update_properties_thumbnail_urls ON public.properties;

-- Drop the function that generates thumbnail URLs
DROP FUNCTION IF EXISTS public.generate_thumbnail_urls(TEXT[]);

-- Drop the function that updates thumbnail URLs
DROP FUNCTION IF EXISTS public.update_thumbnail_urls();

-- Drop the index on thumbnail_urls
DROP INDEX IF EXISTS idx_properties_thumbnail_urls;

-- Drop the view that includes thumbnail information
DROP VIEW IF EXISTS public.properties_with_thumbnails;

-- Finally, drop the unused column
ALTER TABLE public.properties DROP COLUMN IF EXISTS thumbnail_urls;

-- Step 2: Drop the unused user_metrics table
-- This table was created for user analytics but never used
DROP TABLE IF EXISTS public.user_metrics;

-- Step 3: Add comment to document the cleanup
COMMENT ON TABLE public.properties IS 'Properties table - cleaned up unused thumbnail_urls column and user_metrics table removed';

