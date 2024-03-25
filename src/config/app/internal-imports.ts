import { UsersModule } from "src/models/users/users.module";
import { TelegramBotModule } from "src/telegram_bot/bot.module";

export const internalAppModuleImports = [UsersModule, TelegramBotModule]