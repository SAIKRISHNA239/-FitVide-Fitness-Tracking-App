-- ============================================
-- COMPLETE Supabase Database Schema for FitVide
-- ============================================
-- This is the ONLY SQL file you need to run!
-- Run this entire file in Supabase SQL Editor (one time)
-- It includes: tables, RLS policies, triggers, functions, and daily_logs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
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
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workout_name TEXT NOT NULL,
    region TEXT,
    level TEXT,
    exercise_name TEXT,
    duration INTEGER,
    tag TEXT,
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_workout_per_day UNIQUE NULLS NOT DISTINCT (user_id, date, workout_name, exercise_name)
);

-- ============================================
-- 3. WORKOUT_SETS TABLE
-- ============================================
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
-- 6. HYDRATION_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.hydration_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    creatine BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_hydration_per_day UNIQUE (user_id, date)
);

-- ============================================
-- 7. SLEEP_LOGS TABLE
-- ============================================
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

-- ============================================
-- 8. STEP_COUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.step_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INTEGER NOT NULL DEFAULT 0,
    goal INTEGER NOT NULL DEFAULT 10000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_steps_per_day UNIQUE (user_id, date)
);

-- ============================================
-- 9. WEEKLY_CHECKINS TABLE
-- ============================================
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
-- 10. DAILY_LOGS TABLE (For water tracking and daily habits)
-- ============================================
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

-- ============================================
-- 11. INDEXES FOR PERFORMANCE
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
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, date);

-- ============================================
-- 12. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 13. RLS POLICIES - PROFILES
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ============================================
-- 14. RLS POLICIES - WORKOUTS
-- ============================================
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workouts;
CREATE POLICY "Users can view own workouts"
    ON public.workouts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workouts" ON public.workouts;
CREATE POLICY "Users can insert own workouts"
    ON public.workouts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workouts" ON public.workouts;
CREATE POLICY "Users can update own workouts"
    ON public.workouts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workouts" ON public.workouts;
CREATE POLICY "Users can delete own workouts"
    ON public.workouts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 15. RLS POLICIES - WORKOUT_SETS
-- ============================================
DROP POLICY IF EXISTS "Users can view own workout sets" ON public.workout_sets;
CREATE POLICY "Users can view own workout sets"
    ON public.workout_sets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_sets.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own workout sets" ON public.workout_sets;
CREATE POLICY "Users can insert own workout sets"
    ON public.workout_sets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workouts
            WHERE workouts.id = workout_sets.workout_id
            AND workouts.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own workout sets" ON public.workout_sets;
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

DROP POLICY IF EXISTS "Users can delete own workout sets" ON public.workout_sets;
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
-- 16. RLS POLICIES - MEALS
-- ============================================
DROP POLICY IF EXISTS "Users can view own meals" ON public.meals;
CREATE POLICY "Users can view own meals"
    ON public.meals FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meals" ON public.meals;
CREATE POLICY "Users can insert own meals"
    ON public.meals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own meals" ON public.meals;
CREATE POLICY "Users can update own meals"
    ON public.meals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own meals" ON public.meals;
CREATE POLICY "Users can delete own meals"
    ON public.meals FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 17. RLS POLICIES - MEAL_ITEMS
-- ============================================
DROP POLICY IF EXISTS "Users can view own meal items" ON public.meal_items;
CREATE POLICY "Users can view own meal items"
    ON public.meal_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own meal items" ON public.meal_items;
CREATE POLICY "Users can insert own meal items"
    ON public.meal_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meals
            WHERE meals.id = meal_items.meal_id
            AND meals.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own meal items" ON public.meal_items;
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

DROP POLICY IF EXISTS "Users can delete own meal items" ON public.meal_items;
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
-- 18. RLS POLICIES - HYDRATION_LOGS
-- ============================================
DROP POLICY IF EXISTS "Users can view own hydration logs" ON public.hydration_logs;
CREATE POLICY "Users can view own hydration logs"
    ON public.hydration_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own hydration logs" ON public.hydration_logs;
CREATE POLICY "Users can insert own hydration logs"
    ON public.hydration_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own hydration logs" ON public.hydration_logs;
CREATE POLICY "Users can update own hydration logs"
    ON public.hydration_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own hydration logs" ON public.hydration_logs;
CREATE POLICY "Users can delete own hydration logs"
    ON public.hydration_logs FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 19. RLS POLICIES - SLEEP_LOGS
-- ============================================
DROP POLICY IF EXISTS "Users can view own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can view own sleep logs"
    ON public.sleep_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can insert own sleep logs"
    ON public.sleep_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can update own sleep logs"
    ON public.sleep_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can delete own sleep logs"
    ON public.sleep_logs FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 20. RLS POLICIES - STEP_COUNTS
-- ============================================
DROP POLICY IF EXISTS "Users can view own step counts" ON public.step_counts;
CREATE POLICY "Users can view own step counts"
    ON public.step_counts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own step counts" ON public.step_counts;
CREATE POLICY "Users can insert own step counts"
    ON public.step_counts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own step counts" ON public.step_counts;
CREATE POLICY "Users can update own step counts"
    ON public.step_counts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own step counts" ON public.step_counts;
CREATE POLICY "Users can delete own step counts"
    ON public.step_counts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 21. RLS POLICIES - WEEKLY_CHECKINS
-- ============================================
DROP POLICY IF EXISTS "Users can view own weekly checkins" ON public.weekly_checkins;
CREATE POLICY "Users can view own weekly checkins"
    ON public.weekly_checkins FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly checkins" ON public.weekly_checkins;
CREATE POLICY "Users can insert own weekly checkins"
    ON public.weekly_checkins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own weekly checkins" ON public.weekly_checkins;
CREATE POLICY "Users can update own weekly checkins"
    ON public.weekly_checkins FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly checkins" ON public.weekly_checkins;
CREATE POLICY "Users can delete own weekly checkins"
    ON public.weekly_checkins FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 22. RLS POLICIES - DAILY_LOGS
-- ============================================
DROP POLICY IF EXISTS "Users can view own daily logs" ON public.daily_logs;
CREATE POLICY "Users can view own daily logs"
    ON public.daily_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily logs" ON public.daily_logs;
CREATE POLICY "Users can insert own daily logs"
    ON public.daily_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily logs" ON public.daily_logs;
CREATE POLICY "Users can update own daily logs"
    ON public.daily_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily logs" ON public.daily_logs;
CREATE POLICY "Users can delete own daily logs"
    ON public.daily_logs FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 23. FUNCTIONS
-- ============================================

-- Function to automatically create profile on user signup (IMPROVED VERSION)
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily_logs updated_at
CREATE OR REPLACE FUNCTION public.update_daily_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to delete user account (RPC)
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
DECLARE
    user_uuid UUID;
BEGIN
    user_uuid := auth.uid();
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Delete user from auth.users
    -- This will cascade delete all related data due to ON DELETE CASCADE
    DELETE FROM auth.users WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- ============================================
-- 24. TRIGGERS
-- ============================================

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at on relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workouts_updated_at ON public.workouts;
CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON public.workouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_meals_updated_at ON public.meals;
CREATE TRIGGER update_meals_updated_at
    BEFORE UPDATE ON public.meals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_checkins_updated_at ON public.weekly_checkins;
CREATE TRIGGER update_weekly_checkins_updated_at
    BEFORE UPDATE ON public.weekly_checkins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON public.daily_logs;
CREATE TRIGGER update_daily_logs_updated_at
    BEFORE UPDATE ON public.daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_daily_logs_updated_at();

-- ============================================
-- DONE! Your database is now fully set up.
-- ============================================
-- All tables, policies, triggers, and functions are created.
-- New users will automatically get a profile created.
-- All data is protected by Row Level Security.
