-- Convert existing user to admin (using the logged in user jbarahona@ayerviernes.com)
-- First, let's find the user ID for jbarahona@ayerviernes.com and assign admin role

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'jbarahona@ayerviernes.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also make the other user an admin for testing
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email = 'ayer@ayerviernes.com'
ON CONFLICT (user_id, role) DO NOTHING;