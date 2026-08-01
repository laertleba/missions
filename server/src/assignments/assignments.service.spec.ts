import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { AssignmentsService } from './assignments.service'

// Minimal fluent mock of the Supabase query builder: every chained
// method returns `this`, and the test controls what the final await
// resolves to via `resolveWith`.
function makeQueryBuilder(result: { data: any; error: any }) {
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    is: jest.fn(() => builder),
    not: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  }
  return builder
}

function makeSupabaseMock(queueByCall: Array<{ data: any; error: any }>) {
  let call = 0
  return {
    client: {
      from: jest.fn(() => makeQueryBuilder(queueByCall[Math.min(call++, queueByCall.length - 1)])),
    },
  }
}

describe('AssignmentsService', () => {
  const assigner = { id: 'assigner-id', email: 'alice@approved.com' }

  it('rejects when the assigner domain is not approved', async () => {
    const domains = { isApproved: jest.fn().mockResolvedValue(false) }
    const email = { sendAssignmentNotification: jest.fn() }
    const supabase = makeSupabaseMock([{ data: null, error: null }])
    const svc = new AssignmentsService(supabase as any, domains as any, email as any)

    await expect(svc.create(assigner, { assigneeEmail: 'bob@approved.com', title: 'Task' })).rejects.toThrow(
      ForbiddenException,
    )
    expect(email.sendAssignmentNotification).not.toHaveBeenCalled()
  })

  it('rejects cross-domain assignment even when the assigner domain is approved', async () => {
    const domains = { isApproved: jest.fn().mockResolvedValue(true) }
    const email = { sendAssignmentNotification: jest.fn() }
    const supabase = makeSupabaseMock([{ data: null, error: null }])
    const svc = new AssignmentsService(supabase as any, domains as any, email as any)

    await expect(svc.create(assigner, { assigneeEmail: 'eve@other.com', title: 'Task' })).rejects.toThrow(
      ForbiddenException,
    )
    expect(email.sendAssignmentNotification).not.toHaveBeenCalled()
  })

  it('creates the assignment and sends an email when the domains match and are approved', async () => {
    const domains = { isApproved: jest.fn().mockResolvedValue(true) }
    const email = { sendAssignmentNotification: jest.fn().mockResolvedValue(undefined) }
    const insertedRow = {
      id: 'assignment-1',
      assigner_id: assigner.id,
      assigner_email: assigner.email,
      assignee_email: 'bob@approved.com',
      assignee_user_id: null,
      title: 'Task',
      description: '',
      status: 'pending',
      created_at: new Date().toISOString(),
      email_sent_at: null,
    }
    const supabase = makeSupabaseMock([
      { data: insertedRow, error: null }, // insert().select().single()
      { data: null, error: null }, // update email_sent_at
    ])
    const svc = new AssignmentsService(supabase as any, domains as any, email as any)

    const result = await svc.create(assigner, { assigneeEmail: 'bob@approved.com', title: 'Task' })

    expect(result.id).toBe('assignment-1')
    expect(email.sendAssignmentNotification).toHaveBeenCalledWith(
      expect.objectContaining({ toEmail: 'bob@approved.com', title: 'Task', assignerEmail: assigner.email }),
    )
  })

  it('rejects a status update from a user who is not the assignee', async () => {
    const domains = { isApproved: jest.fn() }
    const email = { sendAssignmentNotification: jest.fn() }
    const existing = { id: 'a1', assignee_user_id: 'someone-else' }
    const supabase = makeSupabaseMock([{ data: existing, error: null }])
    const svc = new AssignmentsService(supabase as any, domains as any, email as any)

    await expect(svc.updateStatus(assigner, 'a1', 'completed')).rejects.toThrow(ForbiddenException)
  })

  it('throws NotFoundException when updating a nonexistent assignment', async () => {
    const domains = { isApproved: jest.fn() }
    const email = { sendAssignmentNotification: jest.fn() }
    const supabase = makeSupabaseMock([{ data: null, error: null }])
    const svc = new AssignmentsService(supabase as any, domains as any, email as any)

    await expect(svc.updateStatus(assigner, 'missing', 'completed')).rejects.toThrow(NotFoundException)
  })
})
