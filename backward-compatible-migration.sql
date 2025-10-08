-- Backward Compatible Migration for Thumbnail System
-- This migration ensures existing data remains intact while adding new features

-- Add cover_thumbnail_url column (nullable to maintain compatibility)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS cover_thumbnail_url TEXT;

-- Add comment to explain the new column
COMMENT ON COLUMN public.properties.cover_thumbnail_url IS 'URL of the cover image thumbnail for new properties. NULL for existing properties without thumbnails.';

-- Create index for better performance on cover thumbnail queries
CREATE INDEX IF NOT EXISTS idx_properties_cover_thumbnail ON public.properties (cover_thumbnail_url);

-- Create a function to generate cover thumbnail URL from cover image URL
CREATE OR REPLACE FUNCTION public.generate_cover_thumbnail_url(image_url TEXT)
RETURNS TEXT AS $$
DECLARE
    url_parts TEXT[];
    filename TEXT;
    name_without_ext TEXT;
    thumbnail_filename TEXT;
    thumbnail_url TEXT;
BEGIN
    -- If input is null or empty, return null
    IF image_url IS NULL OR image_url = '' THEN
        RETURN NULL;
    END IF;
    
    -- Split URL by '/'
    url_parts := string_to_array(image_url, '/');
    
    -- Get the filename (last part)
    filename := url_parts[array_length(url_parts, 1)];
    
    -- Remove extension to get name without extension
    name_without_ext := split_part(filename, '.', 1);
    
    -- Create thumbnail filename
    thumbnail_filename := name_without_ext || '-cover-thumb.webp';
    
    -- Replace the filename in the URL
    url_parts[array_length(url_parts, 1)] := thumbnail_filename;
    
    -- Reconstruct the thumbnail URL
    thumbnail_url := array_to_string(url_parts, '/');
    
    RETURN thumbnail_url;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically populate cover_thumbnail_url for NEW properties only
CREATE OR REPLACE FUNCTION public.update_cover_thumbnail_url()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set cover_thumbnail_url for new properties (when id is being generated)
    -- This ensures existing properties are not affected
    IF NEW.cover_thumbnail_url IS NULL AND NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 THEN
        NEW.cover_thumbnail_url := public.generate_cover_thumbnail_url(NEW.images[1]);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update cover_thumbnail_url for NEW properties only
DROP TRIGGER IF EXISTS update_properties_cover_thumbnail ON public.properties;
CREATE TRIGGER update_properties_cover_thumbnail
    BEFORE INSERT ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cover_thumbnail_url();

-- Create a view for properties with cover thumbnail information (backward compatible)
CREATE OR REPLACE VIEW public.properties_with_cover_thumbnails AS
SELECT 
    p.*,
    array_length(p.images, 1) as image_count,
    CASE 
        WHEN array_length(p.images, 1) > 0 THEN p.images[1]
        ELSE NULL
    END as cover_image,
    p.cover_thumbnail_url as cover_thumbnail,
    -- For backward compatibility, generate thumbnail URL if cover_thumbnail_url is NULL
    CASE 
        WHEN p.cover_thumbnail_url IS NOT NULL THEN p.cover_thumbnail_url
        WHEN array_length(p.images, 1) > 0 THEN public.generate_cover_thumbnail_url(p.images[1])
        ELSE NULL
    END as effective_cover_thumbnail
FROM public.properties p;

-- Grant access to the view
GRANT SELECT ON public.properties_with_cover_thumbnails TO authenticated;

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'cover_thumbnail_url';

