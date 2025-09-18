-- Replace location field with address fields
ALTER TABLE public.properties DROP COLUMN location;

-- Add address fields
ALTER TABLE public.properties ADD COLUMN address_line_1 TEXT;
ALTER TABLE public.properties ADD COLUMN address_line_2 TEXT;
ALTER TABLE public.properties ADD COLUMN address_line_3 TEXT;