import { Module } from '@nestjs/common';
import { internalAppModuleImports } from './app/internal-imports';
require('dotenv').config() // use to access to .env file via process (just wotk where has been called)

@Module({
  imports: [
    ...internalAppModuleImports,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
