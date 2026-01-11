# FitVide Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Data Flow](#data-flow)
6. [Authentication Flow](#authentication-flow)
7. [State Management](#state-management)
8. [Database Schema](#database-schema)
9. [Security](#security)
10. [Performance Optimizations](#performance-optimizations)

---

## System Overview

FitVide is built using a **modern, scalable architecture** that follows React Native and Expo best practices. The application uses a **client-server architecture** with Supabase as the backend-as-a-service (BaaS).

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   iOS App    │  │ Android App  │  │   Web App    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  Expo Router    │                        │
│                  │  (Navigation)   │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐              │
│         │                 │                 │              │
│  ┌──────▼──────┐  ┌───────▼──────┐  ┌──────▼──────┐      │
│  │   Context   │  │   Screens    │  │   Services  │      │
│  │  Providers  │  │  (Components) │  │  (Supabase) │      │
│  └─────────────┘  └──────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/REST API
                           │
┌───────────────────────────▼──────────────────────────────────┐
│                    Supabase Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │  PostgreSQL  │  │   Storage    │     │
│  │  (JWT)       │  │  (Database)  │  │  (Files)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Row Level Security (RLS)                   │    │
│  │         Policies & Triggers                        │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Architecture Patterns

### 1. **File-Based Routing (Expo Router)**

The app uses Expo Router's file-based routing system, similar to Next.js:

```
app/
├── _layout.tsx          # Root layout (auth guard)
├── index.tsx            # / (home)
├── log.tsx              # /log
├── nutrition.tsx        # /nutrition
└── ...
```

**Benefits:**
- Automatic route generation
- Type-safe navigation
- Deep linking support
- Code splitting

### 2. **Context API for State Management**

Global state is managed using React Context API:

- **AuthContext**: User authentication state
- **ThemeContext**: Theme preferences (dark/light)
- **NutritionContext**: Nutrition data and calculations

**Why Context API?**
- Simple and built-in
- No external dependencies
- Sufficient for app's state needs
- Easy to understand and maintain

### 3. **Repository Pattern (Data Layer)**

Data access is abstracted through utility functions:

```typescript
// data/getLog.ts
export const getExerciseLogs = () => getLogs("workouts", 30);
export const getHydrationLogs = () => getLogs("hydration_logs", 30);
```

**Benefits:**
- Centralized data fetching logic
- Easy to mock for testing
- Consistent error handling
- Reusable across components

### 4. **Platform-Specific Adapters**

Storage and other platform-specific features use adapters:

```typescript
// lib/supabase.ts
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return localStorageAdapter;
  }
  return secureStoreAdapter;
};
```

---

## Technology Stack

### Frontend Layer

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React Native 0.79.4 | Cross-platform UI |
| **Language** | TypeScript 5.3.3 | Type safety |
| **Navigation** | Expo Router 5.1.0 | File-based routing |
| **State** | React Context API | Global state |
| **Styling** | StyleSheet API + NativeWind | Component styling |

### Backend Layer

| Service | Technology | Purpose |
|---------|-----------|---------|
| **Database** | PostgreSQL (Supabase) | Data persistence |
| **Auth** | Supabase Auth (JWT) | User authentication |
| **Storage** | Supabase Storage | File storage (images) |
| **API** | Supabase REST API | Data access |
| **Security** | Row Level Security (RLS) | Data access control |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Web app deployment |
| **Web Server** | Nginx | Static file serving |
| **Build System** | EAS Build | Mobile app builds |
| **Package Manager** | npm | Dependency management |

---

## Project Structure

```
FitVide-Fitness-Tracking-App/
│
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Home/Dashboard
│   ├── LoginScreen.tsx          # Auth screen
│   ├── log.tsx                  # Workout logging
│   ├── nutrition.tsx            # Nutrition tracking
│   ├── meals.tsx                # Add meals
│   ├── hydration.tsx           # Hydration tracking
│   ├── sleep.tsx                # Sleep logging
│   ├── stepcount.tsx            # Step tracking
│   ├── week.tsx                 # Weekly check-ins
│   ├── profile.tsx              # User profile
│   ├── progress.tsx             # Progress dashboard
│   └── settings.tsx             # App settings
│
├── context/                      # React Context providers
│   ├── AuthContext.tsx           # Authentication state
│   ├── ThemeContext.tsx          # Theme management
│   ├── NutritionContext.tsx      # Nutrition data
│   └── getCalorieBudget.tsx      # Calorie calculations
│
├── lib/                          # Core libraries
│   └── supabase.ts              # Supabase client config
│
├── data/                         # Data layer
│   ├── exercise.json            # Exercise database
│   ├── foodDatabase.json        # Food database
│   └── getLog.ts                # Data fetching utilities
│
├── assets/                       # Static assets
│   ├── images/                  # Images and icons
│   └── fonts/                   # Custom fonts
│
├── styles/                       # Shared styles
│   └── nutritionstyle.tsx      # Nutrition-specific styles
│
├── schema.sql                    # Database schema
├── Dockerfile                    # Docker configuration
├── docker-compose.yml           # Docker Compose setup
├── nginx.conf                   # Nginx configuration
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── tsconfig.json                # TypeScript config
```

---

## Data Flow

### 1. **User Action Flow**

```
User Action
    │
    ▼
Component Event Handler
    │
    ▼
Context/Service Call
    │
    ▼
Supabase Client (lib/supabase.ts)
    │
    ▼
Supabase API (REST/Realtime)
    │
    ▼
PostgreSQL Database
    │
    ▼
RLS Policy Check
    │
    ▼
Data Returned
    │
    ▼
State Update (Context)
    │
    ▼
UI Re-render
```

### 2. **Data Fetching Pattern**

```typescript
// Example: Loading workout logs
useEffect(() => {
  const loadLogs = async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*, workout_sets(*)')
      .eq('user_id', user.id)
      .eq('date', selectedDate);
    
    if (error) {
      // Handle error
      return;
    }
    
    setLogs(data);
  };
  
  loadLogs();
}, [user, selectedDate]);
```

### 3. **Real-time Updates**

```typescript
// Subscribe to real-time changes
const subscription = supabase
  .channel('public:step_counts')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'step_counts' },
    (payload) => {
      // Update UI
    }
  )
  .subscribe();
```

---

## Authentication Flow

### 1. **Sign Up Flow**

```
User enters email/password
    │
    ▼
supabase.auth.signUp()
    │
    ▼
Supabase creates user in auth.users
    │
    ▼
Trigger: handle_new_user()
    │
    ▼
Creates profile in public.profiles
    │
    ▼
Session token stored (SecureStore/localStorage)
    │
    ▼
AuthContext updates user state
    │
    ▼
_layout.tsx redirects to home
```

### 2. **Sign In Flow**

```
User enters credentials
    │
    ▼
supabase.auth.signInWithPassword()
    │
    ▼
Supabase validates credentials
    │
    ▼
JWT token generated
    │
    ▼
Token stored in platform storage
    │
    ▼
AuthContext updates user state
    │
    ▼
Navigation to home screen
```

### 3. **Session Persistence**

- **Native (iOS/Android)**: `expo-secure-store` with chunking for large values
- **Web**: `localStorage` API
- **Auto-refresh**: Supabase automatically refreshes tokens

### 4. **Logout Flow**

```
User clicks logout
    │
    ▼
supabase.auth.signOut()
    │
    ▼
Session cleared from storage
    │
    ▼
AuthContext sets user to null
    │
    ▼
_layout.tsx shows LoginScreen
```

---

## State Management

### Context Providers Hierarchy

```typescript
<ThemeProvider>
  <NutritionProvider>
    <AuthProvider>
      <RootLayout>
        {/* App screens */}
      </RootLayout>
    </AuthProvider>
  </NutritionProvider>
</ThemeProvider>
```

### State Structure

#### AuthContext
```typescript
{
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}
```

#### ThemeContext
```typescript
{
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ColorScheme;
}
```

#### NutritionContext
```typescript
{
  data: {
    protein: number;
    carbs: number;
    fats: number;
    calories: {
      breakfast: number;
      lunch: number;
      dinner: number;
    };
  };
  setData: (data) => void;
}
```

---

## Database Schema

See [DATABASE.md](./DATABASE.md) for detailed schema documentation.

### Key Tables

1. **profiles** - User profile data
2. **workouts** - Workout sessions
3. **workout_sets** - Exercise sets (related to workouts)
4. **meals** - Meal entries
5. **meal_items** - Food items (related to meals)
6. **hydration_logs** - Daily hydration tracking
7. **sleep_logs** - Sleep tracking data
8. **step_counts** - Step tracking
9. **weekly_checkins** - Weekly body measurements

### Relationships

```
profiles (1) ──< (many) workouts
workouts (1) ──< (many) workout_sets
profiles (1) ──< (many) meals
meals (1) ──< (many) meal_items
profiles (1) ──< (many) hydration_logs
profiles (1) ──< (many) sleep_logs
profiles (1) ──< (many) step_counts
profiles (1) ──< (many) weekly_checkins
```

---

## Security

### 1. **Row Level Security (RLS)**

All tables have RLS enabled with policies:

```sql
-- Example: Users can only see their own workouts
CREATE POLICY "Users can view own workouts"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id);
```

### 2. **Authentication**

- JWT tokens for API requests
- Secure token storage (SecureStore on native, localStorage on web)
- Auto token refresh
- Session management

### 3. **Data Validation**

- TypeScript for compile-time validation
- Database constraints (NOT NULL, UNIQUE, etc.)
- Input sanitization in components

### 4. **Account Deletion**

- Cascading deletes via database triggers
- RPC function for secure user deletion
- All user data removed on account deletion

---

## Performance Optimizations

### 1. **Code Splitting**

- Expo Router automatically code-splits routes
- Lazy loading of screens

### 2. **Data Fetching**

- Relational queries to reduce round trips
- Indexed database columns
- Efficient date-based filtering

### 3. **Storage Optimization**

- Chunking for large SecureStore values (2KB limit)
- Platform-specific storage adapters
- Efficient session management

### 4. **UI Optimizations**

- Memoization where needed
- Efficient list rendering
- Image optimization

### 5. **Caching**

- Supabase client-side caching
- Static data (food database, exercises) bundled

---

## Best Practices

### 1. **Error Handling**

```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  // Handle success
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Error', error.message);
}
```

### 2. **Type Safety**

- TypeScript interfaces for all data models
- Typed Supabase client
- Type-safe navigation

### 3. **Code Organization**

- Feature-based file structure
- Separation of concerns (UI, logic, data)
- Reusable components and utilities

### 4. **Testing Strategy**

- Unit tests for utilities
- Integration tests for data layer
- E2E tests for critical flows

---

## Future Enhancements

1. **Offline Support**: Implement offline-first architecture
2. **Push Notifications**: Add workout reminders
3. **Social Features**: Share progress, challenges
4. **AI Recommendations**: Personalized workout/nutrition suggestions
5. **Wearable Integration**: Sync with fitness trackers
6. **Advanced Analytics**: Machine learning insights

---

## References

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
