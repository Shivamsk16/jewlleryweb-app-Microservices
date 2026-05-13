import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// The Supabase admin client (uses the service_role key — bypasses RLS).
// Use this for backend-only operations: Storage uploads, Auth admin calls,
// or any direct REST/PostgREST queries you don't want to model in Prisma.
// Day-to-day relational queries should still go through Prisma.
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export default supabase;
