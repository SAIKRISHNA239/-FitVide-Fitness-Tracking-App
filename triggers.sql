-- ============================================
-- Database Triggers for FitVide
-- ============================================
-- This script fixes the "Missing Profile" issue by automatically
-- creating a profile whenever a new user signs up
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE/REPLACE FUNCTION: handle_new_user
-- ============================================
-- This function automatically creates a profile row when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_email TEXT;
BEGIN
    -- Extract email and name from the new user record
    user_email := COALESCE(NEW.email, '');
    
    -- Try to get name from metadata, then email, then default to 'User'
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        user_email,
        'User'
    );
    
    -- Insert a new profile with the user's ID and default values
    -- Set default values to prevent null errors
    INSERT INTO public.profiles (
        id,
        name,
        age,
        weight,
        height,
        water_intake,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        user_name,
        0,  -- Default age
        0,  -- Default weight
        0,  -- Default height
        0,  -- Default water intake
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. CREATE/REPLACE TRIGGER: on_auth_user_created
-- ============================================
-- This trigger fires AFTER a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. VERIFICATION QUERY (Optional - for testing)
-- ============================================
-- Run this to verify the trigger is working:
-- SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 1;
-- SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 1;

-- ============================================
-- 4. FIX EXISTING USERS (Optional - one-time fix)
-- ============================================
-- If you have existing users without profiles, run this:
-- INSERT INTO public.profiles (id, name, age, weight, height, water_intake, created_at, updated_at)
-- SELECT 
--     u.id,
--     COALESCE(u.raw_user_meta_data->>'name', u.email, 'User'),
--     0,
--     0,
--     0,
--     0,
--     u.created_at,
--     NOW()
-- FROM auth.users u
-- WHERE NOT EXISTS (
--     SELECT 1 FROM public.profiles p WHERE p.id = u.id
-- )
-- ON CONFLICT (id) DO NOTHING;
