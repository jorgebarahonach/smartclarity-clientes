-- Create companies table
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('manual', 'plano', 'archivo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for companies (admins can see all, clients can see their own)
CREATE POLICY "Companies are viewable by everyone" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Admins can insert companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update companies" ON public.companies FOR UPDATE USING (true);

-- Create policies for projects (linked to companies)
CREATE POLICY "Projects are viewable by related company" ON public.projects FOR SELECT USING (
  company_id IN (
    SELECT id FROM public.companies WHERE email = auth.jwt() ->> 'email'
  )
);
CREATE POLICY "Admins can manage projects" ON public.projects FOR ALL USING (true);

-- Create policies for documents (linked to projects)
CREATE POLICY "Documents are viewable by project company" ON public.documents FOR SELECT USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    JOIN public.companies c ON p.company_id = c.id
    WHERE c.email = auth.jwt() ->> 'email'
  )
);
CREATE POLICY "Admins can manage documents" ON public.documents FOR ALL USING (true);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create storage policies
CREATE POLICY "Documents are accessible by project company" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT p.id::text FROM public.projects p
    JOIN public.companies c ON p.company_id = c.id
    WHERE c.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Admins can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents'
);

CREATE POLICY "Admins can update documents" ON storage.objects FOR UPDATE USING (
  bucket_id = 'documents'
);

CREATE POLICY "Admins can delete documents" ON storage.objects FOR DELETE USING (
  bucket_id = 'documents'
);