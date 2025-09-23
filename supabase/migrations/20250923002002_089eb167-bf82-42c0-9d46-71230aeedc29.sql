-- Update companies table structure (will preserve existing data)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS password_temp TEXT;

-- Add a function to create auth users when companies are created by admin
CREATE OR REPLACE FUNCTION public.create_company_auth_user(company_email TEXT, temp_password TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- This function will be called from the client side to create auth users
    -- We cannot directly insert into auth.users from SQL, so this is a placeholder
    -- The actual user creation will be done from the admin interface using signUp
    RETURN gen_random_uuid();
END;
$$;