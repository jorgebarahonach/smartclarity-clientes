-- Add URL metadata columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS url_excerpt TEXT,
ADD COLUMN IF NOT EXISTS url_publication_date DATE,
ADD COLUMN IF NOT EXISTS url_source TEXT;