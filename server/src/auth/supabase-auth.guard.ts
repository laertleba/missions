import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import { SupabaseService } from '../supabase/supabase.service'
import { AuthenticatedUser } from './types'

// Verifies the caller's Supabase access token by asking Supabase Auth
// to validate it — no local JWT-secret handling required. On success,
// attaches the verified { id, email } to the request for downstream
// handlers (see CurrentUser decorator).
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name)

  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>()
    const header = request.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
    if (!token) throw new UnauthorizedException('Missing bearer token')

    const { data, error } = await this.supabase.client.auth.getUser(token)
    if (error || !data.user || !data.user.email) {
      // Client sees a generic message (don't leak internals); server
      // logs the real Supabase error so it's actually diagnosable.
      this.logger.warn(`Token validation failed: ${error?.message ?? 'no user/email on response'}`)
      throw new UnauthorizedException('Invalid or expired session')
    }

    request.user = { id: data.user.id, email: data.user.email.toLowerCase() }
    return true
  }
}
