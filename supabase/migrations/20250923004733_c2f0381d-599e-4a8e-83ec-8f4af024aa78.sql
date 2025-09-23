-- Assign client role to all auth users who have a matching company email but no role
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT au.id, 'client'::app_role
FROM auth.users au
JOIN companies c ON c.email = au.email
LEFT JOIN user_roles ur ON ur.user_id = au.id AND ur.role = 'client'
WHERE ur.user_id IS NULL;

-- Also ensure all existing companies have proper auth users
-- This will show which companies need auth users created
SELECT c.email, c.name
FROM companies c
LEFT JOIN auth.users au ON au.email = c.email
WHERE au.id IS NULL;