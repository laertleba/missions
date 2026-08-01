import { Global, Module } from '@nestjs/common'
import { SupabaseService } from './supabase.service'

// Global: every feature module needs the Supabase client, no point
// re-importing it everywhere.
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
