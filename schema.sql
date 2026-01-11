-- ============================================
-- Supabase Database Schema for Fitness App
-- ============================================
-- This migration creates all tables, RLS policies, and triggers
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Links to auth.users, stores user profile data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female')),
    height NUMERIC,
    weight NUMERIC,
    activity TEXT CHECK (activity IN ('light', 'moderate', 'active', 'sedentary')),
    goal TEXT CHECK (goal IN ('cut', 'maintain', 'bulk')),
    macro_targets JSONB,
    custom_macro_targets JSONB,
    water_intake NUMERIC DEFAULT 0,
    photo_url TEXT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. WORKOUTS TABLE
-- ============================================
-- Stores workout sessions
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workout_name TEXT NOT NULL,
    region TEXT,
    level TEXT,
    exercise_name TEXT,
    duration INTEGER, -- in minutes
    tag TEXT,
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_workout_per_day UNIQUE NULLS NOT DISTINCT (user_id, date, workout_name, exercise_name)
);

-- ============================================
-- 3. WORKOUT_SETS TABLE
-- ============================================
-- Stores individual sets within a workout
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    set_order INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_set_order UNIQUE (workout_id, set_order)
);

-- ============================================
-- 4. MEALS TABLE
-- ============================================
-- Stores meal entries per day
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_meal_per_day UNIQUE (user_id, date, meal_type)
);

-- ============================================
-- 5. MEAL_ITEMS TABLE
-- ============================================
-- Stores individual food items within a meal
CREATE TABLE IF NOT EXISTS public.meal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    serving_size NUMERIC NOT NULL,
    serving_unit TEXT NOT NULL,
    calories NUMERIC NOT NULL,
    protein NUMERIC NOT NULL,
    carbs NUMERIC NOT NULL,
    fats NUMERIC NOT NULL,
    fiber NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ADDITIONAL TABLES FOR SECONDARY FEATURES
-- ============================================

-- Hydration Logs
CREATE TABLE IF NOT EXISTS public.hydration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    creatine BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_hydration_per_day UNIQUE (user_id, date)
);

-- Sleep Logs
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_time TIMESTAMPTZ NOT NULL,
    wake_time TIMESTAMPTZ NOT NULL,
    duration NUMERIC NOT NULL,
    quality INTEGER CHECK (quality >= 1 AND quality <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_sleep_per_day UNIQUE (user_id, date)
);

-- Step Counts
CREATE TABLE IF NOT EXISTS public.step_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INTEGER NOT NULL DEFAULT 0,
    goal INTEGER NOT NULL DEFAULT 10000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_steps_per_day UNIQUE (user_id, date)
);

-- Weekly Check-ins
CREATE TABLE IF NOT EXISTS public.weekly_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    measurements JSONB NOT NULL,
    mood INTEGER CHECK (mood >= 1 AND mood <= 10),
    energy INTEGER CHECK (energy >= 1 AND energy <= 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_checkin_per_day UNIQUE (user_id, date)
);

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON public.workouts(date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON public.workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON public.meal_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON public.hydration_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_step_counts_user_date ON public.step_counts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_user_date ON public.weekly_checkins(user_id, date DESC);

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ============================================
-- WORKOUTS POLICIES
-- ============================================
-- Users can only see their own workouts
CREATE POLICY "Users can view own workouts"
    ON public.workouts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own workouts
CREATE POLICY "Users can insert own workouts"
    ON public.workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own workouts
CREATE POLICY "Users can update own workouts"
    ON public.workouts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own workouts
CREATE POLICY "Users can delete own workouts"
    ON public.workouts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- WORKOUT_SETS POLICIES
-- ============================================
-- Users can only see sets for their own workouts
CREATE POLICY "Users can view own workout sets"
    ON public.workout_sets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_sets.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- Users can insert sets for their own workouts
CREATE POLICY "Users can insert own workout sets"
    ON public.workout_sets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_sets.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- Users can update sets for their own workouts
CREATE POLICY "Users can update own workout sets"
    ON public.workout_sets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_sets.workout_id
            AND workouts.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_sets.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- Users can delete sets for their own workouts
CREATE POLICY "Users can delete own workout sets"
    ON public.workout_sets FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_sets.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

-- ============================================
-- MEALS POLICIES
-- ============================================
-- Users can only see their own meals
CREATE POLICY "Users can view own meals"
    ON public.meals FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own meals
CREATE POLICY "Users can insert own meals"
    ON public.meals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own meals
CREATE POLICY "Users can update own meals"
    ON public.meals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meals
CREATE POLICY "Users can delete own meals"
    ON public.meals FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- MEAL_ITEMS POLICIES
-- ============================================
-- Users can only see items for their own meals
CREATE POLICY "Users can view own meal items"
    ON public.meal_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );

-- Users can insert items for their own meals
CREATE POLICY "Users can insert own meal items"
    ON public.meal_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );

-- Users can update items for their own meals
CREATE POLICY "Users can update own meal items"
    ON public.meal_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );

-- Users can delete items for their own meals
CREATE POLICY "Users can delete own meal items"
    ON public.meal_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );

-- ============================================
-- 8. TRIGGERS
-- ============================================
-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at on relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workouts_updated_at ON public.workouts;
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_meals_updated_at ON public.meals;
CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON public.meals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. HELPER FUNCTIONS (Optional)
-- ============================================
-- Function to delete user account and all related data
-- This is called via RPC from the client
-- Note: All tables have ON DELETE CASCADE, so deleting from auth.users will cascade
-- However, we need to handle this via Supabase Admin API or ensure cascade works
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
    user_uuid UUID;
BEGIN
    user_uuid := auth.uid();
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- All related data will be cascade deleted due to ON DELETE CASCADE constraints
    -- The actual user deletion from auth.users must be done via Admin API
    -- This function serves as a placeholder - actual deletion handled by client
    -- via supabase.auth.admin.deleteUser() or similar
    
    -- For now, we'll just verify the user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Return success - actual deletion handled by Supabase Auth Admin API
    -- The client should call supabase.auth.admin.deleteUser() after this
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- ============================================
-- 10. ADDITIONAL TABLE POLICIES
-- ============================================

-- HYDRATION_LOGS POLICIES
CREATE POLICY "Users can view own hydration logs"
    ON public.hydration_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hydration logs"
    ON public.hydration_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hydration logs"
    ON public.hydration_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hydration logs"
    ON public.hydration_logs FOR DELETE
    USING (auth.uid() = user_id);

-- SLEEP_LOGS POLICIES
CREATE POLICY "Users can view own sleep logs"
    ON public.sleep_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep logs"
    ON public.sleep_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep logs"
    ON public.sleep_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep logs"
    ON public.sleep_logs FOR DELETE
    USING (auth.uid() = user_id);

-- STEP_COUNTS POLICIES
CREATE POLICY "Users can view own step counts"
    ON public.step_counts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own step counts"
    ON public.step_counts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step counts"
    ON public.step_counts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own step counts"
    ON public.step_counts FOR DELETE
    USING (auth.uid() = user_id);

-- WEEKLY_CHECKINS POLICIES
CREATE POLICY "Users can view own weekly checkins"
    ON public.weekly_checkins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly checkins"
    ON public.weekly_checkins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly checkins"
    ON public.weekly_checkins FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly checkins"
    ON public.weekly_checkins FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger for weekly_checkins updated_at
DROP TRIGGER IF EXISTS update_weekly_checkins_updated_at ON public.weekly_checkins;
CREATE TRIGGER update_weekly_checkins_updated_at
    BEFORE UPDATE ON public.weekly_checkins
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
