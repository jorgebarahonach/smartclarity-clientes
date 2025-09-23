-- Limpiar base de datos manteniendo solo roles de admin
-- Eliminar documentos
DELETE FROM documents;

-- Eliminar proyectos
DELETE FROM projects;

-- Eliminar empresas
DELETE FROM companies;

-- Mantener solo roles de admin, eliminar roles de cliente
DELETE FROM user_roles WHERE role = 'client';