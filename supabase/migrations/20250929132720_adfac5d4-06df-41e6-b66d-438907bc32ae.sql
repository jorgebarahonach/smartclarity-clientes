-- Fix critical security issues in companies table

-- 1. Remove the password_temp column (plaintext password storage vulnerability)
ALTER TABLE public.companies DROP COLUMN IF EXISTS password_temp;

-- 2. Fix overly permissive RLS policy that allows any authenticated user to update companies
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;

-- Create restrictive policy that only allows users to update their own company data
CREATE POLICY "Users can update their own company" 
ON public.companies 
FOR UPDATE 
USING (email = (auth.jwt() ->> 'email'::text))
WITH CHECK (email = (auth.jwt() ->> 'email'::text));

-- 3. Update the function signature to remove temp_password parameter (no longer needed)
DROP FUNCTION IF EXISTS public.create_company_auth_user(text, text);

-- Create simpler version that just returns a placeholder (actual user creation is handled by edge functions)
CREATE OR REPLACE FUNCTION public.create_company_auth_user(company_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function serves as a placeholder for the schema
    -- Actual user creation is handled securely through edge functions
    RETURN gen_random_uuid();
END;
$$;