-- Fix: Require authentication to read companies table
CREATE POLICY "Require authentication to view companies"
ON public.companies
FOR SELECT
TO anon
USING (false);

-- Fix: Require authentication to read documents table  
CREATE POLICY "Require authentication to view documents"
ON public.documents
FOR SELECT
TO anon
USING (false);

-- Also restrict other tables for anonymous users
CREATE POLICY "Require authentication to view projects"
ON public.projects
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Require authentication to view user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Require authentication to view document_projects"
ON public.document_projects
FOR SELECT
TO anon
USING (false);