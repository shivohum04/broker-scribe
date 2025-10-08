-- Add missing media column and fix video upload issues
-- This migration adds the media column that's missing from the database

-- Add media column (JSONB array for storing media objects)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the media structure
COMMENT ON COLUMN public.properties.media IS 'JSONB array of media objects with structure: {id, type, url, storageType, localKey?, thumbnailUrl?, uploadedAt}';

-- Create index on media column for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_media ON public.properties USING gin (media);

-- Migrate existing images array to new media structure (only for cloud images)
UPDATE public.properties 
SET media = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', generate_random_uuid()::text,
      'type', 'image',
      'url', value,
      'storageType', 'cloud',
      'thumbnailUrl', CASE 
        WHEN value LIKE '%.jpg' THEN replace(value, '.jpg', '-thumb.webp')
        WHEN value LIKE '%.jpeg' THEN replace(value, '.jpeg', '-thumb.webp')
        WHEN value LIKE '%.png' THEN replace(value, '.png', '-thumb.webp')
        WHEN value LIKE '%.webp' THEN replace(value, '.webp', '-thumb.webp')
        ELSE value || '-thumb.webp'
      END,
      'uploadedAt', created_at
    )
  )
  FROM jsonb_array_elements_text(images::jsonb) AS value
  WHERE images IS NOT NULL 
    AND array_length(images, 1) > 0
    AND NOT value::text LIKE 'local-video-%'  -- Exclude local video markers
)
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0
  AND media = '[]'::jsonb;  -- Only update if media is empty

-- Set cover_thumbnail_url to first image's thumbnail for existing properties
UPDATE public.properties 
SET cover_thumbnail_url = (
  SELECT CASE 
    WHEN array_length(images, 1) > 0 AND images[1] NOT LIKE 'local-video-%' THEN 
      CASE 
        WHEN images[1] LIKE '%.jpg' THEN replace(images[1], '.jpg', '-thumb.webp')
        WHEN images[1] LIKE '%.jpeg' THEN replace(images[1], '.jpeg', '-thumb.webp')
        WHEN images[1] LIKE '%.png' THEN replace(images[1], '.png', '-thumb.webp')
        WHEN images[1] LIKE '%.webp' THEN replace(images[1], '.webp', '-thumb.webp')
        ELSE images[1] || '-thumb.webp'
      END
    ELSE NULL
  END
)
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0 
  AND images[1] NOT LIKE 'local-video-%'  -- Only set cover for real images
  AND cover_thumbnail_url IS NULL;

-- Clean up any local-video markers from images array (they should be in media now)
UPDATE public.properties 
SET images = array_remove(images, unnest(images))
WHERE EXISTS (
  SELECT 1 FROM unnest(images) AS img 
  WHERE img LIKE 'local-video-%'
);

-- Verify the migration worked
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('media', 'cover_thumbnail_url');

-- Show sample of migrated data
SELECT 
    id,
    array_length(images, 1) as image_count,
    jsonb_array_length(media) as media_count,
    cover_thumbnail_url
FROM public.properties 
LIMIT 5;

