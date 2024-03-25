import { TypeOrmModule } from "@nestjs/typeorm";
import { entities } from "../database/entities";
import { join } from "path";
import { ServeStaticModule } from "@nestjs/serve-static";

export const extarnalAppModuleImports = [
    TypeOrmModule.forRoot({
        type: 'sqlite',
        database: 'db/sql',
        entities: [...entities],
        synchronize: true,
    }),
    ServeStaticModule.forRoot({
        rootPath: join(__dirname, '..', 'voices'),
    }),
]