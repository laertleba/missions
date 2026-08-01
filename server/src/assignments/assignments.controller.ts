import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { AuthenticatedUser } from '../auth/types'
import { AssignmentsService } from './assignments.service'
import { CreateAssignmentDto } from './dto/create-assignment.dto'
import { UpdateAssignmentStatusDto } from './dto/update-status.dto'

@Controller('assignments')
@UseGuards(SupabaseAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssignmentDto) {
    return this.assignments.create(user, dto)
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.assignments.findMine(user)
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentStatusDto,
  ) {
    return this.assignments.updateStatus(user, id, dto.status)
  }
}
