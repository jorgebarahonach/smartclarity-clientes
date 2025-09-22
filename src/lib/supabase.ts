import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as base } from '@/integrations/supabase/client'

export const supabase = base as unknown as SupabaseClient<any>
export type { Database } from '@/integrations/supabase/types'
