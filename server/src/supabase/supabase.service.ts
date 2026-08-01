import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Service-role client — bypasses Row Level Security. Only ever
// instantiated here, server-side. Never exposed to the frontend.
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL')
    const serviceRoleKey = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY')
    this.client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
}
