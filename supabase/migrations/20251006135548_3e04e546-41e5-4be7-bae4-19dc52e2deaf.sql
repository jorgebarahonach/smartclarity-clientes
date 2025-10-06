-- Update the check constraint on documents table to include new document types
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_document_type_check 
CHECK (document_type IN ('manual', 'plano', 'archivo', 'normativa', 'doc_oficial', 'otro'));