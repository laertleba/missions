import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SupabaseModule } from './supabase/supabase.module'
import { DomainsModule } from './domains/domains.module'
import { EmailModule } from './email/email.module'
import { AssignmentsModule } from './assignments/assignments.module'
import { MeModule } from './me/me.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    DomainsModule,
    EmailModule,
    AssignmentsModule,
    MeModule,
  ],
})
export class AppModule {}
