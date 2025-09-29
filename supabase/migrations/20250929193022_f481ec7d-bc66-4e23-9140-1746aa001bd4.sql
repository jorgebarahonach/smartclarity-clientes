-- Add original_file_name column to documents table
ALTER TABLE public.documents 
ADD COLUMN original_file_name TEXT;

-- Update existing records to populate the original_file_name from the current name field
UPDATE public.documents 
SET original_file_name = name 
WHERE original_file_name IS NULL;