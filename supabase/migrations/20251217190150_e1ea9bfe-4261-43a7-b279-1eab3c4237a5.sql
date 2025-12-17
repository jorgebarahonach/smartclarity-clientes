-- Drop overly permissive storage policies from initial migration
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Documents are accessible by project company" ON storage.objects;

-- Recreate proper storage policies with admin role verification
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow clients to read documents in their company projects
CREATE POLICY "Documents are accessible by project company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    -- Admins can read all
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Clients can read documents in their company projects
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.document_projects dp ON d.id = dp.document_id
      JOIN public.projects p ON dp.project_id = p.id
      JOIN public.companies c ON p.company_id = c.id
      WHERE d.file_path = storage.objects.name
      AND c.email = (auth.jwt() ->> 'email')
    )
  )
);