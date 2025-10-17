-- 1. Agregar campo is_default a la tabla projects
ALTER TABLE public.projects 
ADD COLUMN is_default BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Crear el proyecto especial para todas las empresas existentes
INSERT INTO public.projects (company_id, name, description, is_default)
SELECT 
  id,
  'Información & archivos estratégicos',
  'Archivos y enlaces estratégicos compartidos por SmartClarity',
  TRUE
FROM public.companies
WHERE NOT EXISTS (
  SELECT 1 FROM public.projects 
  WHERE company_id = companies.id 
  AND is_default = TRUE
);

-- 3. Crear función para auto-crear el proyecto especial cuando se crea una empresa
CREATE OR REPLACE FUNCTION public.create_default_project_for_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear el proyecto por defecto para la nueva empresa
  INSERT INTO public.projects (company_id, name, description, is_default)
  VALUES (
    NEW.id,
    'Información & archivos estratégicos',
    'Archivos y enlaces estratégicos compartidos por SmartClarity',
    TRUE
  );
  RETURN NEW;
END;
$$;

-- 4. Crear trigger para ejecutar la función
CREATE TRIGGER create_default_project_on_company_insert
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.create_default_project_for_company();

-- 5. Modificar tabla documents para soportar URLs y múltiples proyectos
ALTER TABLE public.documents 
ADD COLUMN url TEXT,
ADD COLUMN is_url BOOLEAN DEFAULT FALSE NOT NULL,
ALTER COLUMN file_path DROP NOT NULL,
ALTER COLUMN file_type DROP NOT NULL,
ALTER COLUMN file_size DROP NOT NULL;

-- 6. Crear tabla intermedia para relación many-to-many entre documents y projects
CREATE TABLE public.document_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(document_id, project_id)
);

-- 7. Migrar datos existentes a la tabla intermedia
INSERT INTO public.document_projects (document_id, project_id)
SELECT id, project_id 
FROM public.documents 
WHERE project_id IS NOT NULL;

-- 8. Ahora podemos hacer project_id nullable en documents (mantenerlo por compatibilidad)
ALTER TABLE public.documents ALTER COLUMN project_id DROP NOT NULL;

-- 9. Habilitar RLS en la nueva tabla
ALTER TABLE public.document_projects ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para document_projects
CREATE POLICY "Admins can manage all document_projects"
ON public.document_projects
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view their company document_projects"
ON public.document_projects
FOR SELECT
USING (
  project_id IN (
    SELECT p.id 
    FROM public.projects p
    JOIN public.companies c ON p.company_id = c.id
    WHERE c.email = auth.jwt()->>'email'
  )
);

-- 11. Actualizar política de documentos para permitir inserción de admins
DROP POLICY IF EXISTS "Documents are viewable by project company" ON public.documents;

CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view documents in their company projects"
ON public.documents
FOR SELECT
USING (
  id IN (
    SELECT dp.document_id
    FROM public.document_projects dp
    JOIN public.projects p ON dp.project_id = p.id
    JOIN public.companies c ON p.company_id = c.id
    WHERE c.email = auth.jwt()->>'email'
  )
);

-- 12. Crear índices para mejorar performance
CREATE INDEX idx_document_projects_document_id ON public.document_projects(document_id);
CREATE INDEX idx_document_projects_project_id ON public.document_projects(project_id);
CREATE INDEX idx_projects_is_default ON public.projects(is_default);
CREATE INDEX idx_documents_is_url ON public.documents(is_url);