type Environment = NodeJS.ProcessEnv;

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export type SupabaseServerConfig = SupabasePublicConfig & {
  secretKey: string;
};

function read(value: string | undefined) {
  return value?.trim() ?? "";
}

export function getSupabasePublicConfig(
  environment: Environment = process.env,
): SupabasePublicConfig | null {
  const url = read(environment.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = read(environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!url || !publishableKey) return null;

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { url, publishableKey };
}

export function getSupabaseServerConfig(
  environment: Environment = process.env,
): SupabaseServerConfig | null {
  const publicConfig = getSupabasePublicConfig(environment);
  const secretKey = read(environment.SUPABASE_SECRET_KEY);

  if (!publicConfig || !secretKey) return null;

  return { ...publicConfig, secretKey };
}
