-- Migration: fix_user_profiles_rls_circular_dependency
-- Created at: 1762161007

-- Fix circular dependency in RLS policies
-- First, drop all existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can create profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON user_profiles;

-- Create new policies without circular dependency

-- 1. Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Allow service role to do anything
CREATE POLICY "Service role can do anything" ON user_profiles
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 3. Allow profile creation (for registration)
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'anon' OR auth.uid() = user_id);

-- 4. Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Allow authenticated users to view profiles (needed for admin functionality)
-- This policy allows viewing profiles but with a safe approach
CREATE POLICY "Allow profile viewing" ON user_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');;