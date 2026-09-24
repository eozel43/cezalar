import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge function errors carry our Turkish message in the response body;
// supabase-js only exposes a generic English message by default
export const functionErrorMessage = async (error: any, fallback: string): Promise<string> => {
  try {
    const body = await error?.context?.json?.();
    if (body?.error?.message) return body.error.message;
  } catch {
    // body was not JSON
  }
  return fallback;
};
