import { INestApplication, ExecutionContext } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { MeController } from '../src/me/me.controller'
import { DomainsService } from '../src/domains/domains.service'
import { SupabaseAuthGuard } from '../src/auth/supabase-auth.guard'

// e2e over the real HTTP layer, with the auth guard and domain lookup
// stubbed out — no live Supabase project required to run this.
describe('GET /me/eligibility (e2e)', () => {
  let app: INestApplication
  let currentEmail = 'alice@approved.com'
  const isApproved = jest.fn()

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MeController],
      providers: [{ provide: DomainsService, useValue: { isApproved } }],
    })
      .overrideGuard(SupabaseAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest()
          req.user = { id: 'user-1', email: currentEmail }
          return true
        },
      })
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns eligible: true and the domain when it is approved', async () => {
    currentEmail = 'alice@approved.com'
    isApproved.mockResolvedValueOnce(true)

    const res = await request(app.getHttpServer()).get('/me/eligibility').expect(200)
    expect(res.body).toEqual({ eligible: true, domain: 'approved.com' })
  })

  it('returns eligible: false and no domain when it is not approved', async () => {
    currentEmail = 'bob@random.com'
    isApproved.mockResolvedValueOnce(false)

    const res = await request(app.getHttpServer()).get('/me/eligibility').expect(200)
    expect(res.body).toEqual({ eligible: false, domain: null })
  })
})
