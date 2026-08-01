import { IsIn } from 'class-validator'

export class UpdateAssignmentStatusDto {
  @IsIn(['pending', 'completed'])
  status!: 'pending' | 'completed'
}
