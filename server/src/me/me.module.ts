import { Module } from '@nestjs/common'
import { MeController } from './me.controller'
import { DomainsModule } from '../domains/domains.module'

@Module({
  imports: [DomainsModule],
  controllers: [MeController],
})
export class MeModule {}
