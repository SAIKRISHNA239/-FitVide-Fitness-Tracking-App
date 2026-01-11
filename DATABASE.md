# Database Schema Documentation

## Overview

FitVide uses PostgreSQL via Supabase with Row Level Security (RLS) enabled on all tables. This document describes the database schema, relationships, constraints, and security policies.

## Schema Diagram

```
┌─────────────┐
│   profiles  │
│  (1)        │
└──────┬──────┘
       │
       │ (1:N)
       │
   ┌───┴──────────────────────────────────────────────┐
   │                                                   │
┌──▼──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  workouts   │  │    meals     │  │hydration_logs│  │
│  (N)        │  │    (N)       │  │    (N)      │  │
└───┬─────────┘  └───┬──────────┘  └──────────────┘  │
    │                │                                │
    │ (1:N)          │ (1:N)                         │
    │                │                                │
┌───▼──────────┐  ┌─▼──────────┐                   │
│ workout_sets │  │ meal_items  │                   │
│    (N)       │  │    (N)      │                   │
└──────────────┘  └─────────────┘                   │
                                                    │
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  sleep_logs  │  │ step_counts │  │weekly_checkins│
│    (N)       │  │    (N)      │  │    (N)        │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Tables

### profiles

User profile information and settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FK → auth.users | User ID (matches auth.users.id) |
| `age` | INTEGER | NULL | User age |
| `gender` | TEXT | NULL | 'male', 'female', 'other' |
| `height` | NUMERIC | NULL | Height in cm |
| `weight` | NUMERIC | NULL | Weight in kg |
| `activity` | TEXT | NULL | Activity level |
| `goal` | TEXT | NULL | Fitness goal |
| `macro_targets` | JSONB | NULL | Calculated macro targets |
| `custom_macro_targets` | JSONB | NULL | User-defined macro targets |
| `photo_url` | TEXT | NULL | Profile image URL |
| `name` | TEXT | NULL | User's display name |
| `water_intake` | NUMERIC | NULL | Daily water intake goal |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_profiles_id` on `id`

**Triggers:**
- `update_updated_at_column()` - Updates `updated_at` on changes

---

### workouts

Workout/exercise sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Workout ID |
| `user_id` | UUID | NOT NULL, FK → profiles.id | User who created workout |
| `date` | DATE | NOT NULL | Workout date |
| `workout_name` | TEXT | NOT NULL | Name of workout |
| `region` | TEXT | NULL | Body region |
| `level` | TEXT | NULL | Difficulty level |
| `exercise_name` | TEXT | NOT NULL | Exercise name |
| `duration` | NUMERIC | NULL | Duration in minutes |
| `tag` | TEXT | NULL | Workout tag |
| `intensity` | NUMERIC | NULL | Intensity (1-10) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Constraints:**
- `unique_workout_per_day` - UNIQUE(user_id, date, workout_name, exercise_name)

**Indexes:**
- `idx_workouts_user_id` on `user_id`
- `idx_workouts_date` on `date`
- `idx_workouts_user_date` on `(user_id, date)`

**Foreign Keys:**
- `user_id` → `profiles.id` ON DELETE CASCADE

**Triggers:**
- `update_updated_at_column()` - Updates `updated_at` on changes

---

### workout_sets

Individual sets within a workout.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Set ID |
| `workout_id` | UUID | NOT NULL, FK → workouts.id | Parent workout |
| `set_order` | INTEGER | NOT NULL | Set number (1, 2, 3...) |
| `reps` | INTEGER | NOT NULL | Number of repetitions |
| `weight` | NUMERIC | NOT NULL | Weight in kg |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Constraints:**
- `unique_set_order` - UNIQUE(workout_id, set_order)

**Indexes:**
- `idx_workout_sets_workout_id` on `workout_id`

**Foreign Keys:**
- `workout_id` → `workouts.id` ON DELETE CASCADE

---

### meals

Meal entries (Breakfast, Lunch, Dinner).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Meal ID |
| `user_id` | UUID | NOT NULL, FK → profiles.id | User who created meal |
| `date` | DATE | NOT NULL | Meal date |
| `meal_type` | TEXT | NOT NULL | 'Breakfast', 'Lunch', 'Dinner' |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Constraints:**
- `unique_meal_per_day` - UNIQUE(user_id, date, meal_type)

**Indexes:**
- `idx_meals_user_id` on `user_id`
- `idx_meals_date` on `date`
- `idx_meals_user_date` on `(user_id, date)`

**Foreign Keys:**
- `user_id` → `profiles.id` ON DELETE CASCADE

**Triggers:**
- `update_updated_at_column()` - Updates `updated_at` on changes

---

### meal_items

Food items within a meal.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Item ID |
| `meal_id` | UUID | NOT NULL, FK → meals.id | Parent meal |
| `name` | TEXT | NOT NULL | Food name |
| `quantity` | NUMERIC | NOT NULL | Quantity consumed |
| `serving_size` | NUMERIC | NOT NULL | Standard serving size |
| `serving_unit` | TEXT | NOT NULL | Unit (g, ml, cup, etc.) |
| `calories` | NUMERIC | NOT NULL | Calories |
| `protein` | NUMERIC | NOT NULL | Protein in grams |
| `carbs` | NUMERIC | NOT NULL | Carbs in grams |
| `fats` | NUMERIC | NOT NULL | Fats in grams |
| `fiber` | NUMERIC | NOT NULL, DEFAULT 0 | Fiber in grams |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- `idx_meal_items_meal_id` on `meal_id`

**Foreign Keys:**
- `meal_id` → `meals.id` ON DELETE CASCADE

---

### hydration_logs

Daily hydration tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Log ID |
| `user_id` | UUID | NOT NULL, FK → profiles.id | User ID |
| `date` | DATE | NOT NULL | Log date |
| `amount` | NUMERIC | NOT NULL | Water intake in ml |
| `creatine` | BOOLEAN | NOT NULL, DEFAULT false | Creatine taken |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Constraints:**
- `unique_hydration_per_day` - UNIQUE(user_id, date)

**Indexes:**
- `idx_hydration_logs_user_id` on `user_id`
- `idx_hydration_logs_date` on `date`
- `idx_hydration_logs_user_date` on `(user_id, date)`

**Foreign Keys:**
- `user_id` → `profiles.id` ON DELETE CASCADE

---

### sleep_logs

Sleep tracking data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Log ID |
| `user_id` | UUID | NOT NULL, FK → profiles.id | User ID |
| `date` | DATE | NOT NULL | Sleep date |
| `sleep_time` | TIMESTAMP | NOT NULL | Sleep start time |
| `wake_time` | TIMESTAMP | NOT NULL | Wake time |
| `duration` | NUMERIC | NOT NULL | Sleep duration in hours |
| `quality` | INTEGER | NOT NULL | Quality rating (1-5) |
| `notes` | TEXT | NULL | Additional notes |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Constraints:**
- `unique_sleep_per_day` - UNIQUE(user_id, date)
- `check_quality_range` - CHECK (quality >= 1 AND quality <= 5)

**Indexes:**
- `idx_sleep_logs_user_id` on `user_id`
- `idx_sleep_logs_date` on `date`
- `idx_sleep_logs_user_date` on `(user_id, date)`

**Foreign Keys:**
- `user_id` → `profiles.id` ON DELETE CASCADE

---

### step_counts

Daily step tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Log ID |
| `user_id` | UUID | NOT NULL, FK → profiles.id | User ID |
| `date` | DATE | NOT NULL | Step count date |
| `steps` | INTEGER | NOT NULL | Number of steps |
| `goal` | INTEGER | NOT NULL | Daily step goal |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Constraints:**
- `unique_steps_per_day` - UNIQUE(user_id, date)

**Indexes:**
- `idx_step_counts_user_id` on `user_id`
- `idx_step_counts_date` on `date`
- `idx_step_counts_user_date` on `(user_id, date)`

**Foreign Keys:**
- `user_id` → `profiles.id` ON DELETE CASCADE

---

### weekly_checkins

Weekly body measurements and mood tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Check-in ID |
| `user_id` | UUID | NOT NULL, FK → profiles.id | User ID |
| `date` | DATE | NOT NULL | Check-in date |
| `measurements` | JSONB | NOT NULL | Body measurements |
| `mood` | INTEGER | NOT NULL | Mood rating (1-5) |
| `energy` | INTEGER | NOT NULL | Energy level (1-5) |
| `notes` | TEXT | NULL | Additional notes |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |

**Constraints:**
- `unique_checkin_per_day` - UNIQUE(user_id, date)
- `check_mood_range` - CHECK (mood >= 1 AND mood <= 5)
- `check_energy_range` - CHECK (energy >= 1 AND energy <= 5)

**Indexes:**
- `idx_weekly_checkins_user_id` on `user_id`
- `idx_weekly_checkins_date` on `date`
- `idx_weekly_checkins_user_date` on `(user_id, date)`

**Foreign Keys:**
- `user_id` → `profiles.id` ON DELETE CASCADE

---

## Row Level Security (RLS)

All tables have RLS enabled with the following policy pattern:

### SELECT Policies
Users can only view their own data:
```sql
CREATE POLICY "Users can view own [table]"
  ON public.[table] FOR SELECT
  USING (auth.uid() = user_id);
```

### INSERT Policies
Users can only insert their own data:
```sql
CREATE POLICY "Users can insert own [table]"
  ON public.[table] FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### UPDATE Policies
Users can only update their own data:
```sql
CREATE POLICY "Users can update own [table]"
  ON public.[table] FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### DELETE Policies
Users can only delete their own data:
```sql
CREATE POLICY "Users can delete own [table]"
  ON public.[table] FOR DELETE
  USING (auth.uid() = user_id);
```

### Special Cases

**profiles table:**
- Users can view/update their own profile
- Profile is automatically created on user signup via trigger

**workout_sets and meal_items:**
- Access controlled through parent table (workouts/meals)
- Users can only access sets/items for their own workouts/meals

---

## Triggers

### 1. handle_new_user()

Automatically creates a profile when a new user signs up:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. update_updated_at_column()

Automatically updates the `updated_at` timestamp:

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to: `profiles`, `workouts`, `meals`

---

## Functions

### delete_user_account()

RPC function to delete user account and all related data:

```sql
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
  user_uuid UUID;
BEGIN
  user_uuid := auth.uid();
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** This function requires `SECURITY DEFINER` to delete from `auth.users`. In production, consider using a Supabase Edge Function instead.

---

## Cascading Deletes

All foreign keys use `ON DELETE CASCADE`, ensuring:

- Deleting a user deletes all their data
- Deleting a workout deletes all its sets
- Deleting a meal deletes all its items

---

## Indexes

Indexes are created on:
- All `user_id` columns (for RLS filtering)
- All `date` columns (for date-based queries)
- Composite indexes on `(user_id, date)` for common query patterns

---

## Data Types

- **UUID**: Primary keys and foreign keys
- **DATE**: All date fields (YYYY-MM-DD format)
- **TIMESTAMP**: Created/updated timestamps
- **NUMERIC**: Decimal numbers (weights, measurements)
- **INTEGER**: Whole numbers (reps, steps, ratings)
- **TEXT**: Strings (names, descriptions)
- **JSONB**: Structured data (measurements, macro targets)
- **BOOLEAN**: True/false values

---

## Migration Guide

To set up the database:

1. Create a Supabase project
2. Open SQL Editor
3. Run `schema.sql` file
4. Verify tables and policies in Table Editor
5. Create storage bucket `avatars` for profile images

---

## Best Practices

1. **Always use RLS**: Never disable RLS on production tables
2. **Use indexes**: Index foreign keys and frequently queried columns
3. **Cascade deletes**: Use CASCADE for data integrity
4. **Validate data**: Use CHECK constraints for data validation
5. **Unique constraints**: Prevent duplicate daily entries
6. **Timestamps**: Always track created_at and updated_at

---

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
