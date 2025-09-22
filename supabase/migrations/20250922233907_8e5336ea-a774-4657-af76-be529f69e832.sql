-- Políticas para el bucket 'documents'
-- Política para que usuarios autenticados puedan subir sus propios documentos
CREATE POLICY "Users can upload documents to their projects" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] IN (
  SELECT p.id::text 
  FROM projects p 
  JOIN companies c ON p.company_id = c.id 
  WHERE c.email = (auth.jwt() ->> 'email'::text)
));

-- Política para que usuarios autenticados puedan ver documentos de sus proyectos
CREATE POLICY "Users can view documents from their projects" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] IN (
  SELECT p.id::text 
  FROM projects p 
  JOIN companies c ON p.company_id = c.id 
  WHERE c.email = (auth.jwt() ->> 'email'::text)
));

-- Política para que administradores puedan gestionar todos los documentos
CREATE POLICY "Admins can manage all documents" 
ON storage.objects 
FOR ALL 
TO authenticated
USING (bucket_id = 'documents');

-- Política para que usuarios puedan eliminar documentos de sus proyectos  
CREATE POLICY "Users can delete documents from their projects" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] IN (
  SELECT p.id::text 
  FROM projects p 
  JOIN companies c ON p.company_id = c.id 
  WHERE c.email = (auth.jwt() ->> 'email'::text)
));