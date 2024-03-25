import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
require('dotenv').config() // use to access to .env file via process (just wotk where has been called)

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
}
bootstrap();
