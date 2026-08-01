import { Module } from '@nestjs/common'
import { AssignmentsController } from './assignments.controller'
import { AssignmentsService } from './assignments.service'
import { DomainsModule } from '../domains/domains.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [DomainsModule, EmailModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
})
export class AssignmentsModule {}
