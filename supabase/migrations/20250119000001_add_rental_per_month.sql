-- Add rental_per_month column to properties table
ALTER TABLE public.properties 
ADD COLUMN rental_per_month DECIMAL DEFAULT 0;
