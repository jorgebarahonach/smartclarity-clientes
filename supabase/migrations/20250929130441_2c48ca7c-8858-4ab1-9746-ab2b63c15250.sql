-- Ensure admin role for jbarahona@ayerviernes.com
-- First, let's make sure the user exists and has the correct role

-- Check if user exists and update role if needed
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID for the email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'jbarahona@ayerviernes.com';
    
    IF target_user_id IS NOT NULL THEN
        -- Ensure the admin role exists
        INSERT INTO user_roles (user_id, role) 
        VALUES (target_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Remove any client role if it exists
        DELETE FROM user_roles 
        WHERE user_id = target_user_id AND role = 'client'::app_role;
        
        RAISE NOTICE 'Admin role ensured for user %', target_user_id;
    ELSE
        RAISE NOTICE 'User with email jbarahona@ayerviernes.com not found';
    END IF;
END $$;