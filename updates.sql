-- ============================================
-- Database Updates for FitVide
-- ============================================
-- Run this in Supabase SQL Editor after running schema.sql
-- This adds daily_logs table and delete_user function

-- ============================================
-- 1. DAILY_LOGS TABLE
-- ============================================
-- Stores daily habit tracking (water, weight, sleep, mood)
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    water_intake INTEGER DEFAULT 0,
    weight NUMERIC,
    sleep_hours NUMERIC,
    mood TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_daily_log_per_day UNIQUE (user_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_logs
-- Users can view their own daily logs
CREATE POLICY "Users can view own daily logs"
    ON public.daily_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own daily logs
CREATE POLICY "Users can insert own daily logs"
    ON public.daily_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own daily logs
CREATE POLICY "Users can update own daily logs"
    ON public.daily_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own daily logs
CREATE POLICY "Users can delete own daily logs"
    ON public.daily_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_daily_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_logs_updated_at
    BEFORE UPDATE ON public.daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_daily_logs_updated_at();

-- ============================================
-- 2. DELETE_USER FUNCTION
-- ============================================
-- RPC function to allow users to delete their own account
-- This requires SECURITY DEFINER to delete from auth.users
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get current user ID
    user_uuid := auth.uid();
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Delete user from auth.users
    -- This will cascade delete all related data due to ON DELETE CASCADE
    DELETE FROM auth.users WHERE id = user_uuid;
    
    -- If deletion was successful, the function returns void
    -- All related data is automatically deleted via CASCADE
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- ============================================
-- 3. COMMENTS (Optional but helpful)
-- ============================================
COMMENT ON TABLE public.daily_logs IS 'Stores daily habit tracking data (water intake, weight, sleep, mood)';
COMMENT ON COLUMN public.daily_logs.water_intake IS 'Water intake in milliliters (ml)';
COMMENT ON COLUMN public.daily_logs.weight IS 'Weight in kilograms (kg)';
COMMENT ON COLUMN public.daily_logs.sleep_hours IS 'Sleep duration in hours (decimal)';
COMMENT ON COLUMN public.daily_logs.mood IS 'Mood text description';

COMMENT ON FUNCTION public.delete_user() IS 'Allows authenticated users to delete their own account and all related data';
