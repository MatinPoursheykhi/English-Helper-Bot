import { Module } from '@nestjs/common';
import { internalAppModuleImports } from './config/app/internal-imports';
import { extarnalAppModuleImports } from './config/app/extarnal-imports';

@Module({
  imports: [
    ...extarnalAppModuleImports,
    ...internalAppModuleImports,
  ],
  controllers: [],
  providers: [],
  exports:[],
})
export class AppModule { }
