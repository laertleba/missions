import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateAssignmentDto {
  @IsEmail()
  assigneeEmail!: string

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string
}
