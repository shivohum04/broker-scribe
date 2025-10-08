-- Apply thumbnail support migration
-- Run this script in your Supabase SQL editor

-- Add thumbnail_urls column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS thumbnail_urls TEXT[] DEFAULT '{}';

-- Add comment to explain the new column
COMMENT ON COLUMN public.properties.thumbnail_urls IS 'Array of thumbnail URLs corresponding to images array, used for lazy loading and performance optimization';

-- Create index for better performance on thumbnail queries
CREATE INDEX IF NOT EXISTS idx_properties_thumbnail_urls ON public.properties USING GIN (thumbnail_urls);

-- Update existing properties to have empty thumbnail_urls arrays
-- This ensures data consistency
UPDATE public.properties 
SET thumbnail_urls = '{}' 
WHERE thumbnail_urls IS NULL;

-- Create a function to automatically generate thumbnail URLs from image URLs
CREATE OR REPLACE FUNCTION public.generate_thumbnail_urls(image_urls TEXT[])
RETURNS TEXT[] AS $$
DECLARE
    result TEXT[] := '{}';
    url TEXT;
    url_parts TEXT[];
    filename TEXT;
    name_without_ext TEXT;
    thumbnail_filename TEXT;
    thumbnail_url TEXT;
BEGIN
    -- If input is null or empty, return empty array
    IF image_urls IS NULL OR array_length(image_urls, 1) IS NULL THEN
        RETURN '{}';
    END IF;
    
    -- Process each image URL
    FOREACH url IN ARRAY image_urls
    LOOP
        -- Split URL by '/'
        url_parts := string_to_array(url, '/');
        
        -- Get the filename (last part)
        filename := url_parts[array_length(url_parts, 1)];
        
        -- Remove extension to get name without extension
        name_without_ext := split_part(filename, '.', 1);
        
        -- Create thumbnail filename
        thumbnail_filename := name_without_ext || '-thumb.webp';
        
        -- Replace the filename in the URL
        url_parts[array_length(url_parts, 1)] := thumbnail_filename;
        
        -- Reconstruct the thumbnail URL
        thumbnail_url := array_to_string(url_parts, '/');
        
        -- Add to result array
        result := array_append(result, thumbnail_url);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically populate thumbnail_urls when images are updated
CREATE OR REPLACE FUNCTION public.update_thumbnail_urls()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate thumbnail URLs from image URLs
    NEW.thumbnail_urls := public.generate_thumbnail_urls(NEW.images);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update thumbnail_urls when images are modified
DROP TRIGGER IF EXISTS update_properties_thumbnail_urls ON public.properties;
CREATE TRIGGER update_properties_thumbnail_urls
    BEFORE INSERT OR UPDATE OF images ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.update_thumbnail_urls();

-- Update existing properties to generate thumbnail URLs
UPDATE public.properties 
SET images = images 
WHERE array_length(images, 1) > 0;

-- Create a view for properties with thumbnail information
CREATE OR REPLACE VIEW public.properties_with_thumbnails AS
SELECT 
    p.*,
    array_length(p.images, 1) as image_count,
    array_length(p.thumbnail_urls, 1) as thumbnail_count,
    CASE 
        WHEN array_length(p.images, 1) > 0 THEN p.images[1]
        ELSE NULL
    END as cover_image,
    CASE 
        WHEN array_length(p.thumbnail_urls, 1) > 0 THEN p.thumbnail_urls[1]
        ELSE NULL
    END as cover_thumbnail
FROM public.properties p;

-- Grant access to the view
GRANT SELECT ON public.properties_with_thumbnails TO authenticated;

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'thumbnail_urls';

