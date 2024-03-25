import { Module } from '@nestjs/common';
import { TelegramBotService } from './bot.service';
import { CommandHandlerJOB } from './jobs/commandHandler.job';
import { UsersModule } from 'src/models/users/users.module';
import { BotVocabularyAPI } from './api/botVocabulary.api';
import { HttpModule } from '@nestjs/axios';
import { BotTextToSpeechJOB } from './jobs/botTextToVoice.job';

@Module({
    imports: [UsersModule, HttpModule],
    providers: [TelegramBotService, CommandHandlerJOB, BotVocabularyAPI, BotTextToSpeechJOB],
})
export class TelegramBotModule { }
