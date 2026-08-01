import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  const origins = (config.get<string>('CORS_ORIGIN') || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
  app.enableCors({ origin: origins.length ? origins : false })

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))

  const port = config.get<number>('PORT') || 3000
  await app.listen(port)
}
bootstrap()
