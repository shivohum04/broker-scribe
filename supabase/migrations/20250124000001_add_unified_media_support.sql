-- Add unified media support to properties table
-- This migration adds support for the new MediaItem[] structure

-- Add media column if it doesn't exist (it should already exist from previous migrations)
-- But let's make sure it's properly configured
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- Add index for media queries
CREATE INDEX IF NOT EXISTS idx_properties_media ON properties USING GIN (media);

-- Add function to get cover image from media array
CREATE OR REPLACE FUNCTION get_cover_image_url(media_array JSONB)
RETURNS TEXT AS $$
BEGIN
  -- Look for the first image marked as cover
  FOR i IN 0..jsonb_array_length(media_array) - 1 LOOP
    IF (media_array->i->>'type' = 'image' AND 
        (media_array->i->>'isCover')::boolean = true AND 
        media_array->i->>'thumbnailUrl' IS NOT NULL) THEN
      RETURN media_array->i->>'thumbnailUrl';
    END IF;
  END LOOP;
  
  -- If no cover image found, look for first image with thumbnail
  FOR i IN 0..jsonb_array_length(media_array) - 1 LOOP
    IF (media_array->i->>'type' = 'image' AND 
        media_array->i->>'thumbnailUrl' IS NOT NULL) THEN
      RETURN media_array->i->>'thumbnailUrl';
    END IF;
  END LOOP;
  
  -- If no image thumbnails, return null
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add function to get media count by type
CREATE OR REPLACE FUNCTION get_media_counts(media_array JSONB)
RETURNS JSONB AS $$
DECLARE
  image_count INTEGER := 0;
  video_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  total_count := jsonb_array_length(media_array);
  
  FOR i IN 0..total_count - 1 LOOP
    IF media_array->i->>'type' = 'image' THEN
      image_count := image_count + 1;
    ELSIF media_array->i->>'type' = 'video' THEN
      video_count := video_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'images', image_count,
    'videos', video_count,
    'total', total_count
  );
END;
$$ LANGUAGE plpgsql;

-- Update existing properties to migrate from images array to media array
-- This is a one-time migration for backward compatibility
UPDATE properties 
SET media = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', 'legacy-' || (ordinality - 1),
      'type', 'image',
      'storageType', 'cloud',
      'url', value,
      'isCover', (ordinality = 1),
      'uploadedAt', NOW()::text,
      'fileName', 'legacy-image-' || (ordinality - 1),
      'fileSize', 0,
      'fileType', 'image/jpeg'
    )
  )
  FROM jsonb_array_elements_text(COALESCE(images, '[]'::jsonb)) WITH ORDINALITY
)
WHERE images IS NOT NULL 
  AND jsonb_array_length(images) > 0 
  AND (media IS NULL OR jsonb_array_length(media) = 0);

-- Add trigger to automatically update cover_thumbnail_url when media changes
CREATE OR REPLACE FUNCTION update_cover_thumbnail_from_media()
RETURNS TRIGGER AS $$
BEGIN
  -- Update cover_thumbnail_url based on media array
  NEW.cover_thumbnail_url := get_cover_image_url(NEW.media);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_cover_thumbnail ON properties;
CREATE TRIGGER trigger_update_cover_thumbnail
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_cover_thumbnail_from_media();

-- Add comments for documentation
COMMENT ON COLUMN properties.media IS 'Unified media array containing both images and videos with metadata';
COMMENT ON FUNCTION get_cover_image_url(JSONB) IS 'Extracts cover image URL from media array, prioritizing marked cover images';
COMMENT ON FUNCTION get_media_counts(JSONB) IS 'Returns count of images, videos, and total media items';

