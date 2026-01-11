# API Documentation

## Overview

FitVide uses Supabase as its backend, which provides a RESTful API and real-time subscriptions. This document describes the API endpoints, data models, and usage patterns.

## Base URL

```
https://your-project.supabase.co/rest/v1/
```

## Authentication

All API requests require authentication via JWT tokens. The Supabase client automatically includes the token in request headers.

### Headers

```
Authorization: Bearer <jwt_token>
apikey: <anon_key>
Content-Type: application/json
```

---

## Data Models

### User Profile

```typescript
interface Profile {
  id: string;                    // UUID (matches auth.users.id)
  age: number | null;
  gender: string | null;         // 'male' | 'female' | 'other'
  height: number | null;         // in cm
  weight: number | null;         // in kg
  activity: string | null;       // 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: string | null;          // 'cut' | 'maintain' | 'bulk'
  macro_targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;
  custom_macro_targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;
  photo_url: string | null;
  name: string | null;
  water_intake: number | null;
  created_at: string;
  updated_at: string;
}
```

### Workout

```typescript
interface Workout {
  id: string;
  user_id: string;
  date: string;                 // YYYY-MM-DD
  workout_name: string;
  region: string | null;         // 'upper' | 'lower' | 'full' | 'cardio'
  level: string | null;         // 'beginner' | 'intermediate' | 'advanced'
  exercise_name: string;
  duration: number | null;       // in minutes
  tag: string | null;
  intensity: number | null;     // 1-10
  created_at: string;
  updated_at: string;
  workout_sets: WorkoutSet[];   // Related sets
}
```

### Workout Set

```typescript
interface WorkoutSet {
  id: string;
  workout_id: string;
  set_order: number;
  reps: number;
  weight: number;               // in kg
  created_at: string;
}
```

### Meal

```typescript
interface Meal {
  id: string;
  user_id: string;
  date: string;                 // YYYY-MM-DD
  meal_type: string;            // 'Breakfast' | 'Lunch' | 'Dinner'
  created_at: string;
  updated_at: string;
  meal_items: MealItem[];       // Related items
}
```

### Meal Item

```typescript
interface MealItem {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  serving_size: number;
  serving_unit: string;         // 'g' | 'ml' | 'cup' | etc.
  calories: number;
  protein: number;              // in grams
  carbs: number;                // in grams
  fats: number;                 // in grams
  fiber: number;                // in grams
  created_at: string;
}
```

### Hydration Log

```typescript
interface HydrationLog {
  id: string;
  user_id: string;
  date: string;                 // YYYY-MM-DD
  amount: number;               // in ml
  creatine: boolean;
  created_at: string;
}
```

### Sleep Log

```typescript
interface SleepLog {
  id: string;
  user_id: string;
  date: string;                 // YYYY-MM-DD
  sleep_time: string;           // ISO 8601 timestamp
  wake_time: string;            // ISO 8601 timestamp
  duration: number;             // in hours (decimal)
  quality: number;              // 1-5
  notes: string | null;
  created_at: string;
}
```

### Step Count

```typescript
interface StepCount {
  id: string;
  user_id: string;
  date: string;                 // YYYY-MM-DD
  steps: number;
  goal: number;                 // Daily step goal
  created_at: string;
}
```

### Weekly Check-in

```typescript
interface WeeklyCheckin {
  id: string;
  user_id: string;
  date: string;                 // YYYY-MM-DD
  measurements: {
    weight: string;
    chest: string;
    waist: string;
    hips: string;
    arms: string;
    thighs: string;
  };
  mood: number;                 // 1-5
  energy: number;               // 1-5
  notes: string | null;
  created_at: string;
}
```

---

## API Endpoints

### Authentication

#### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

#### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

#### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

#### Get Current Session

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

---

### Profiles

#### Get Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

#### Update Profile

```typescript
const { error } = await supabase
  .from('profiles')
  .update({
    age: 25,
    height: 175,
    weight: 70
  })
  .eq('id', user.id);
```

#### Create Profile

```typescript
const { error } = await supabase
  .from('profiles')
  .insert({
    id: user.id,
    age: 25,
    height: 175,
    weight: 70
  });
```

---

### Workouts

#### Get Workouts for Date

```typescript
const { data, error } = await supabase
  .from('workouts')
  .select(`
    *,
    workout_sets (
      set_order,
      reps,
      weight
    )
  `)
  .eq('user_id', user.id)
  .eq('date', '2024-01-15');
```

#### Create Workout

```typescript
const { data: workout, error } = await supabase
  .from('workouts')
  .insert({
    user_id: user.id,
    date: '2024-01-15',
    workout_name: 'Push Day',
    region: 'upper',
    level: 'intermediate',
    exercise_name: 'Bench Press',
    intensity: 7
  })
  .select()
  .single();

// Then add sets
const { error: setsError } = await supabase
  .from('workout_sets')
  .insert([
    { workout_id: workout.id, set_order: 1, reps: 10, weight: 80 },
    { workout_id: workout.id, set_order: 2, reps: 8, weight: 85 }
  ]);
```

#### Update Workout

```typescript
const { error } = await supabase
  .from('workouts')
  .update({ intensity: 8 })
  .eq('id', workoutId);
```

#### Delete Workout

```typescript
// This will cascade delete all related workout_sets
const { error } = await supabase
  .from('workouts')
  .delete()
  .eq('id', workoutId);
```

---

### Meals

#### Get Meals for Date

```typescript
const { data, error } = await supabase
  .from('meals')
  .select(`
    *,
    meal_items (
      id,
      name,
      quantity,
      serving_size,
      serving_unit,
      calories,
      protein,
      carbs,
      fats,
      fiber
    )
  `)
  .eq('user_id', user.id)
  .eq('date', '2024-01-15');
```

#### Create Meal and Items

```typescript
// First, get or create meal
let { data: meal } = await supabase
  .from('meals')
  .select('id')
  .eq('user_id', user.id)
  .eq('date', '2024-01-15')
  .eq('meal_type', 'Breakfast')
  .single();

if (!meal) {
  const { data: newMeal } = await supabase
    .from('meals')
    .insert({
      user_id: user.id,
      date: '2024-01-15',
      meal_type: 'Breakfast'
    })
    .select()
    .single();
  meal = newMeal;
}

// Then add meal items
const { error } = await supabase
  .from('meal_items')
  .insert({
    meal_id: meal.id,
    name: 'Oatmeal',
    quantity: 100,
    serving_size: 100,
    serving_unit: 'g',
    calories: 389,
    protein: 17,
    carbs: 66,
    fats: 7,
    fiber: 10
  });
```

#### Delete Meal Item

```typescript
const { error } = await supabase
  .from('meal_items')
  .delete()
  .eq('id', itemId);
```

---

### Hydration

#### Get Hydration Log

```typescript
const { data, error } = await supabase
  .from('hydration_logs')
  .select('*')
  .eq('user_id', user.id)
  .eq('date', '2024-01-15')
  .single();
```

#### Upsert Hydration Log

```typescript
// Check if exists
const { data: existing } = await supabase
  .from('hydration_logs')
  .select('id')
  .eq('user_id', user.id)
  .eq('date', '2024-01-15')
  .single();

if (existing) {
  // Update
  const { error } = await supabase
    .from('hydration_logs')
    .update({ amount: 2000, creatine: true })
    .eq('id', existing.id);
} else {
  // Insert
  const { error } = await supabase
    .from('hydration_logs')
    .insert({
      user_id: user.id,
      date: '2024-01-15',
      amount: 2000,
      creatine: true
    });
}
```

---

### Sleep

#### Get Sleep Logs

```typescript
const { data, error } = await supabase
  .from('sleep_logs')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: false })
  .limit(30);
```

#### Create/Update Sleep Log

```typescript
const sleepData = {
  user_id: user.id,
  date: '2024-01-15',
  sleep_time: '2024-01-15T22:00:00Z',
  wake_time: '2024-01-16T06:30:00Z',
  duration: 8.5,
  quality: 4,
  notes: 'Slept well'
};

// Check if exists
const { data: existing } = await supabase
  .from('sleep_logs')
  .select('id')
  .eq('user_id', user.id)
  .eq('date', sleepData.date)
  .single();

if (existing) {
  await supabase
    .from('sleep_logs')
    .update(sleepData)
    .eq('id', existing.id);
} else {
  await supabase
    .from('sleep_logs')
    .insert(sleepData);
}
```

---

### Step Counts

#### Get Step Counts

```typescript
const { data, error } = await supabase
  .from('step_counts')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: false });
```

#### Upsert Step Count

```typescript
const { error } = await supabase
  .from('step_counts')
  .upsert({
    user_id: user.id,
    date: '2024-01-15',
    steps: 8500,
    goal: 10000
  }, {
    onConflict: 'user_id,date'
  });
```

---

### Weekly Check-ins

#### Get Weekly Check-ins

```typescript
const { data, error } = await supabase
  .from('weekly_checkins')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: false });
```

#### Create/Update Check-in

```typescript
const checkinData = {
  user_id: user.id,
  date: '2024-01-15',
  measurements: {
    weight: '70',
    chest: '100',
    waist: '80',
    hips: '95',
    arms: '35',
    thighs: '60'
  },
  mood: 4,
  energy: 5,
  notes: 'Feeling great!'
};

// Check if exists
const { data: existing } = await supabase
  .from('weekly_checkins')
  .select('id')
  .eq('user_id', user.id)
  .eq('date', checkinData.date)
  .single();

if (existing) {
  await supabase
    .from('weekly_checkins')
    .update(checkinData)
    .eq('id', existing.id);
} else {
  await supabase
    .from('weekly_checkins')
    .insert(checkinData);
}
```

---

## Real-time Subscriptions

### Subscribe to Step Counts

```typescript
const subscription = supabase
  .channel('public:step_counts')
  .on('postgres_changes', 
    { 
      event: '*',
      schema: 'public',
      table: 'step_counts',
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      console.log('Change received!', payload);
      // Update UI
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(subscription);
};
```

---

## Storage API

### Upload Profile Image

```typescript
// Convert image to blob
const response = await fetch(imageUri);
const blob = await response.blob();

// Upload
const fileExt = imageUri.split('.').pop();
const fileName = `${user.id}.${fileExt}`;
const filePath = `profile-images/${fileName}`;

const { error: uploadError } = await supabase.storage
  .from('avatars')
  .upload(filePath, blob, {
    cacheControl: '3600',
    upsert: true
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath);

// Update profile
await supabase
  .from('profiles')
  .update({ photo_url: publicUrl })
  .eq('id', user.id);
```

---

## Error Handling

### Common Error Codes

- `PGRST116`: No rows returned (not necessarily an error)
- `PGRST301`: Authentication required
- `23505`: Unique constraint violation
- `23503`: Foreign key constraint violation

### Error Handling Pattern

```typescript
const { data, error } = await supabase
  .from('table')
  .select('*');

if (error) {
  if (error.code === 'PGRST116') {
    // No rows found - handle gracefully
    return [];
  }
  if (error.code === 'PGRST301') {
    // Auth error - redirect to login
    await logout();
    return;
  }
  // Other errors
  console.error('Error:', error);
  throw error;
}

return data;
```

---

## Rate Limiting

Supabase has rate limits based on your plan:
- **Free tier**: 500 requests per second
- **Pro tier**: Higher limits

Monitor your usage in the Supabase dashboard.

---

## Best Practices

1. **Use Relational Queries**: Fetch related data in one query
2. **Filter Early**: Use `.eq()` filters before `.select()` for better performance
3. **Handle Errors**: Always check for errors and handle them appropriately
4. **Use Upsert**: For daily logs, use upsert to avoid duplicates
5. **Cleanup Subscriptions**: Always unsubscribe from real-time channels
6. **Type Safety**: Use TypeScript interfaces for all data models

---

## References

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase REST API](https://supabase.com/docs/reference/javascript/select)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
