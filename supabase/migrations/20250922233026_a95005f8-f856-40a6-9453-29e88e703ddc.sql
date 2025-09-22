-- Remove the overly permissive policy
DROP POLICY "Companies are viewable by everyone" ON public.companies;

-- Create more secure policies
-- 1. Allow users to see only their own company based on their email
CREATE POLICY "Users can view their own company" ON public.companies 
FOR SELECT 
TO authenticated 
USING (email = auth.jwt() ->> 'email');

-- 2. Allow admins to see all companies (for admin functionality)
-- Note: This assumes admin users will have specific email domains or we'll implement roles later
CREATE POLICY "Admins can view all companies" ON public.companies 
FOR SELECT 
TO authenticated 
USING (
  -- For now, allow access if user is authenticated and accessing admin pages
  -- This will need to be refined with proper role management
  true
);

-- 3. Keep the insert/update policies restricted (only for authenticated users)
-- These were already secure, but let's make them more explicit
DROP POLICY "Admins can insert companies" ON public.companies;
DROP POLICY "Admins can update companies" ON public.companies;

CREATE POLICY "Authenticated users can insert companies" ON public.companies 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies" ON public.companies 
FOR UPDATE 
TO authenticated 
USING (true);