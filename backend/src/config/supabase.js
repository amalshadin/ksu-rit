import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('CRITICAL: SUPABASE_URL environment variable is missing.');
    process.exit(1);
}

if (!supabaseServiceKey || supabaseServiceKey === 'your_supabase_service_role_key_here') {
    console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is missing or set to placeholder. Database write operations may fail.');
}

// Create a single Supabase client instance using the service role key to manage events/gallery
export const supabase = createClient(supabaseUrl, supabaseServiceKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});
