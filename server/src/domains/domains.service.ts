import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'

function domainOf(email: string): string {
  return email.toLowerCase().split('@')[1] ?? ''
}

@Injectable()
export class DomainsService {
  constructor(private readonly supabase: SupabaseService) {}

  async isApproved(domain: string): Promise<boolean> {
    if (!domain) return false
    const { data, error } = await this.supabase.client
      .from('approved_domains')
      .select('domain')
      .eq('domain', domain.toLowerCase())
      .maybeSingle()
    if (error) throw error
    return !!data
  }

  async isEmailEligible(email: string): Promise<boolean> {
    return this.isApproved(domainOf(email))
  }
}

export { domainOf }
