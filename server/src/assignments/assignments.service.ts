import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { DomainsService, domainOf } from '../domains/domains.service'
import { EmailService } from '../email/email.service'
import { AuthenticatedUser } from '../auth/types'
import { CreateAssignmentDto } from './dto/create-assignment.dto'

export interface AssignmentRow {
  id: string
  assigner_id: string
  assigner_email: string
  assignee_email: string
  assignee_user_id: string | null
  title: string
  description: string
  status: 'pending' | 'completed'
  created_at: string
  email_sent_at: string | null
  update_requested_at: string | null
}

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly domains: DomainsService,
    private readonly email: EmailService,
  ) {}

  // Core authorization rule: the assigner's email domain must be on the
  // admin-approved allowlist, AND the assignee's email must share that
  // exact same domain (no cross-company assignment). Enforced here in
  // one audited place — the DB tables have no client-facing RLS
  // policies at all, so this service is the only path to the data.
  async create(assigner: AuthenticatedUser, dto: CreateAssignmentDto): Promise<AssignmentRow> {
    const assignerDomain = domainOf(assigner.email)
    const assigneeDomain = domainOf(dto.assigneeEmail)

    const assignerApproved = await this.domains.isApproved(assignerDomain)
    if (!assignerApproved) {
      throw new ForbiddenException('Your email domain is not approved for task assignment')
    }
    if (assigneeDomain !== assignerDomain) {
      throw new ForbiddenException('You may only assign tasks within your own approved domain')
    }

    // assignee_user_id starts null even if that email already has an
    // account — findMine()'s backfill links it the moment they next
    // check their own assignments, keyed off their verified JWT email.
    const { data, error } = await this.supabase.client
      .from('assignments')
      .insert({
        assigner_id: assigner.id,
        assigner_email: assigner.email,
        assignee_email: dto.assigneeEmail.toLowerCase(),
        title: dto.title,
        description: dto.description ?? '',
      })
      .select()
      .single()
    if (error || !data) throw error ?? new Error('Failed to create assignment')

    const row = data as AssignmentRow

    await this.email.sendAssignmentNotification({
      toEmail: row.assignee_email,
      title: row.title,
      description: row.description,
      assignerEmail: row.assigner_email,
    })
    await this.supabase.client
      .from('assignments')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', row.id)

    return row
  }

  // Assignments received by the caller. Also backfills assignee_user_id
  // for any pending assignment made before this email had an account —
  // a one-line reconciliation rather than a separate linking job.
  async findMine(user: AuthenticatedUser): Promise<AssignmentRow[]> {
    await this.supabase.client
      .from('assignments')
      .update({ assignee_user_id: user.id })
      .is('assignee_user_id', null)
      .eq('assignee_email', user.email)

    const { data, error } = await this.supabase.client
      .from('assignments')
      .select()
      .eq('assignee_user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AssignmentRow[]
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: 'pending' | 'completed'): Promise<AssignmentRow> {
    const { data: existing, error: fetchError } = await this.supabase.client
      .from('assignments')
      .select()
      .eq('id', id)
      .maybeSingle()
    if (fetchError) throw fetchError
    if (!existing) throw new NotFoundException('Assignment not found')
    if (existing.assignee_user_id !== user.id) {
      throw new ForbiddenException('Only the assignee can update this assignment')
    }

    const { data, error } = await this.supabase.client
      .from('assignments')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (error || !data) throw error ?? new Error('Failed to update assignment')
    return data as AssignmentRow
  }

  // Assignments the caller has sent to others.
  async findSent(user: AuthenticatedUser): Promise<AssignmentRow[]> {
    const { data, error } = await this.supabase.client
      .from('assignments')
      .select()
      .eq('assigner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AssignmentRow[]
  }

  // Assigner pings the assignee for a status update on a still-pending
  // task. Assigner-only — mirrors the assignee-only guard on updateStatus.
  async requestUpdate(user: AuthenticatedUser, id: string): Promise<AssignmentRow> {
    const { data: existing, error: fetchError } = await this.supabase.client
      .from('assignments')
      .select()
      .eq('id', id)
      .maybeSingle()
    if (fetchError) throw fetchError
    if (!existing) throw new NotFoundException('Assignment not found')
    if (existing.assigner_id !== user.id) {
      throw new ForbiddenException('Only the assigner can request an update')
    }

    await this.email.sendUpdateRequest({
      toEmail: existing.assignee_email,
      title: existing.title,
      assignerEmail: existing.assigner_email,
    })

    const { data, error } = await this.supabase.client
      .from('assignments')
      .update({ update_requested_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error || !data) throw error ?? new Error('Failed to record update request')
    return data as AssignmentRow
  }
}
