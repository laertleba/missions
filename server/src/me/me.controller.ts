import { Controller, Get, UseGuards } from '@nestjs/common'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { AuthenticatedUser } from '../auth/types'
import { DomainsService, domainOf } from '../domains/domains.service'

@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class MeController {
  constructor(private readonly domains: DomainsService) {}

  // Frontend calls this once after login to decide whether to render
  // the assignment feature at all. Ineligible users see no trace of it.
  @Get('eligibility')
  async eligibility(@CurrentUser() user: AuthenticatedUser) {
    const domain = domainOf(user.email)
    const eligible = await this.domains.isApproved(domain)
    return { eligible, domain: eligible ? domain : null }
  }
}
