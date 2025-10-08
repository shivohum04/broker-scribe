-- Add media jsonb and cover_thumbnail_url columns to properties table
ALTER TABLE properties 
ADD COLUMN media jsonb DEFAULT '[]'::jsonb,
ADD COLUMN cover_thumbnail_url text;

-- Create index on media column for better query performance
CREATE INDEX idx_properties_media ON properties USING gin (media);

-- Migrate existing images array to new media structure
UPDATE properties 
SET media = jsonb_build_array(
  jsonb_build_object(
    'id', generate_random_uuid()::text,
    'type', 'image',
    'url', unnest(images),
    'storageType', 'cloud',
    'uploadedAt', created_at
  )
)
WHERE images IS NOT NULL AND array_length(images, 1) > 0;

-- Set cover_thumbnail_url to first image's thumbnail for existing properties
UPDATE properties 
SET cover_thumbnail_url = (
  SELECT CASE 
    WHEN array_length(images, 1) > 0 THEN 
      replace(images[1], '.jpg', '-thumb.webp')
      || CASE 
        WHEN images[1] LIKE '%.jpeg' THEN replace(images[1], '.jpeg', '-thumb.webp')
        WHEN images[1] LIKE '%.png' THEN replace(images[1], '.png', '-thumb.webp')
        WHEN images[1] LIKE '%.webp' THEN replace(images[1], '.webp', '-thumb.webp')
        ELSE images[1] || '-thumb.webp'
      END
    ELSE NULL
  END
)
WHERE images IS NOT NULL AND array_length(images, 1) > 0;

-- Add comment to document the media structure
COMMENT ON COLUMN properties.media IS 'JSONB array of media objects with structure: {id, type, url, storageType, localKey?, thumbnailUrl?, uploadedAt}';
COMMENT ON COLUMN properties.cover_thumbnail_url IS 'URL of the cover thumbnail image for this property';
