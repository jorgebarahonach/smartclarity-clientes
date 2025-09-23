-- Crear algunos proyectos de prueba para las empresas existentes
INSERT INTO projects (name, description, company_id)
SELECT 
  'Proyecto Minería Digital', 
  'Implementación de sistemas digitales para optimización de procesos mineros',
  id
FROM companies 
WHERE name = 'Codelco'
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, description, company_id)
SELECT 
  'Modernización Portuaria', 
  'Actualización de sistemas de control y monitoreo del puerto',
  id
FROM companies 
WHERE name = 'Puerto de Valparaíso'
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, description, company_id)
SELECT 
  'Sistema de Gestión Ambiental', 
  'Implementación de monitoreo ambiental automatizado',
  id
FROM companies 
WHERE name = 'Codelco'
ON CONFLICT DO NOTHING;