# Environment Variables Documentation

This document describes all environment variables used in the FitVide application.

## Overview

FitVide uses environment variables for configuration, particularly for Supabase connection settings. These variables are loaded at build time and are prefixed with `EXPO_PUBLIC_` to be accessible in the client-side code.

---

## Required Variables

### EXPO_PUBLIC_SUPABASE_URL

**Description:** Your Supabase project URL

**Type:** String (URL)

**Example:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

**Where to find it:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL"

**Required:** Yes

**Security:** Safe to expose (public URL)

---

### EXPO_PUBLIC_SUPABASE_ANON_KEY

**Description:** Your Supabase anonymous/public key

**Type:** String (JWT)

**Example:**
```env
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNzY1NDQwMCwiZXhwIjoxOTMzMzY2NDAwfQ.example
```

**Where to find it:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "anon/public" key

**Required:** Yes

**Security:** Safe to expose (public key, protected by RLS)

**Note:** This is the public/anonymous key. Never use the service role key in client-side code!

---

## Environment File Setup

### Development

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Production

For production deployments, set environment variables in your hosting platform:

**Vercel:**
- Go to Project Settings → Environment Variables
- Add each variable for Production environment

**Netlify:**
- Go to Site Settings → Environment Variables
- Add each variable

**Docker:**
- Use `docker-compose.yml` or pass via `-e` flag:
  ```bash
  docker run -e EXPO_PUBLIC_SUPABASE_URL=... -e EXPO_PUBLIC_SUPABASE_ANON_KEY=...
  ```

**EAS Build (Mobile):**
- Use `eas.json` secrets or environment variables
- Or set in EAS dashboard under Project Settings

---

## Loading Environment Variables

### Expo/React Native

Expo automatically loads variables prefixed with `EXPO_PUBLIC_` from:
1. `.env` file (development)
2. System environment variables (production)

Access in code:
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

### Type Safety

The app validates these variables at startup:

```typescript
// lib/supabase.ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set EXPO_PUBLIC_SUPABASE_URL and ' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}
```

---

## Security Best Practices

### ✅ DO

- Use `EXPO_PUBLIC_` prefix for client-side variables
- Store sensitive keys server-side (never in client code)
- Use Supabase RLS to protect data (not just API keys)
- Rotate keys if compromised
- Use different projects for dev/staging/production

### ❌ DON'T

- Commit `.env` files to version control
- Use service role key in client code
- Hardcode API keys in source code
- Share production keys publicly
- Use same keys for dev and production

---

## .gitignore

Ensure `.env` is in `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.*.local
```

---

## Example .env File

Create a `.env.example` file (commit this, not `.env`):

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

This serves as a template for other developers.

---

## Troubleshooting

### Variables Not Loading

1. **Check prefix:** Must start with `EXPO_PUBLIC_`
2. **Restart server:** Restart Expo dev server after adding variables
3. **Check file location:** `.env` must be in project root
4. **Rebuild:** For production, rebuild the app after adding variables

### Invalid URL/Key

- Verify URL format: `https://xxx.supabase.co`
- Verify key is the "anon/public" key, not service role key
- Check for extra spaces or quotes in `.env` file

### Build Errors

- Ensure all required variables are set before building
- Check variable names are spelled correctly
- Verify no syntax errors in `.env` file

---

## Environment-Specific Configuration

### Development

```env
EXPO_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=dev_anon_key
```

### Staging

```env
EXPO_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=staging_anon_key
```

### Production

```env
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
```

---

## Additional Configuration

### Supabase Project Settings

After setting environment variables, configure in Supabase:

1. **Site URL:** Your app's URL (for OAuth redirects)
2. **Redirect URLs:** Add your app's redirect URLs
3. **CORS:** Configure if needed (usually not required)

---

## References

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Quick Reference

| Variable | Required | Security | Example |
|----------|----------|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Yes | Public | `https://xxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Public* | `eyJhbGc...` |

*Public but protected by Row Level Security (RLS)
