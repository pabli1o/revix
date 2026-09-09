function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// NEXT_PUBLIC_* vars must be accessed as a static `process.env.NEXT_PUBLIC_X`
// member expression so Next.js's build-time inlining can find and replace it.
// A dynamic `process.env[name]` lookup is invisible to that step and always
// evaluates to `undefined` in the browser bundle, regardless of what's set
// in the hosting provider's dashboard.
export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublishableKey(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function getSupabaseSecretKey(): string {
  return requireEnv("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
}
