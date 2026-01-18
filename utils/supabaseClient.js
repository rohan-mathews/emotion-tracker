import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://daiqoqztjcfvevivxgbm.supabase.co'
const supabaseKey = 'sb_publishable_teu3RiYiGiUQGA3RTCnUZA_x5_PBbM-'

export const supabase = createClient(supabaseUrl, supabaseKey)