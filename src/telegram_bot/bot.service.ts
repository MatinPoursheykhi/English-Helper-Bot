import { Injectable, OnModuleInit } from "@nestjs/common";
import { commandsMessage, BotMode, NativeLangsArray, BotModeArray } from "./constants/bot.constants";
import { CommandHandlerJOB } from "./jobs/commandHandler.job";
import { UsersService } from "src/models/users/users.service";
import { BotVocabularyAPI } from "./api/botVocabulary.api";
import { Menu, nativeLangs, skillOptions } from "./constants/keyboard.constant";
import { VocabularyResponseStruct } from "./structs/bot.structs";
import { BotTextToSpeechJOB } from "./jobs/botTextToVoice.job";
import { translate } from '@vitalets/google-translate-api';
import * as fs from 'fs'
const TelegramBot = require('node-telegram-bot-api');
const EventEmitter = require('node:events');
EventEmitter.defaultMaxListeners = 0;
const eventEmitter = new EventEmitter();

require('dotenv').config()


@Injectable()
export class TelegramBotService implements OnModuleInit {
    private readonly bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    public mode: BotMode;

    constructor(
        private readonly usersService: UsersService,
        private readonly commandHandler: CommandHandlerJOB,
        private readonly botVocabularyAPI: BotVocabularyAPI,
        private readonly botTextToSpeech: BotTextToSpeechJOB,
    ) { }

    async onModuleInit() { // bot ID `@mateenLLbot`
        // MENU -------------------------------------------------------
        await this.bot.setMyCommands(Menu);

        // Listening to user's messages and manage most of the bot reactions ----------------------------------------------------------
        this.bot.on('message', async (msg: any): Promise<void> => {
            const chatId = msg.chat.id;
            const text = msg.text;
            const is_command: Array<Object> | undefined = msg.entities;

            try {
                // if user have not click on /start -----------------------------------------
                const user_exist = await this.usersService.findUser(chatId);
                if (!user_exist && !is_command)
                    await this.bot.sendMessage(chatId, commandsMessage.notStarted());

                // check if it's an invalid command ----------------------
                else if (is_command) {
                    const command_exists: boolean = await this.commandHandler.commandExists(msg);
                    if (!command_exists)
                        await this.bot.sendMessage(chatId, commandsMessage.undefinedCommand());
                }
                // check if bot does not have any specific mode ------------------
                else if (!this.mode)
                    await this.bot.sendMessage(chatId, commandsMessage.noMode());

                // check execute the specific mode ---------------------------
                else {
                    const response = await this.executeProperMode(text);
                    // make and send a response to the specific mode --------------------
                    await this.modeSpreader(msg, response);
                }
            } catch (error) {
                console.log(error);
            }
        })

        // COMMANDS ------------------------------------------------------------

        // create user if it's new --------------------
        this.bot.onText(/\/start/, async (msg: any) => {
            const chatId = msg.chat.id;
            const { chat } = msg;

            try {
                // check if user exists ----------------------------
                const user_exist = await this.usersService.findUser(chatId);
                if (!user_exist)
                    await this.usersService.create(chat);

                await this.bot.sendMessage(chatId, commandsMessage.start(msg.from.first_name));

                this.mode = null; // empty bot's mode
            } catch (error) {
                console.log(error);
            }
        });

        // set the user native lang--------------------
        this.bot.onText(/\/nativelang/, async (msg: any) => {
            const chatId = msg.chat.id;

            try {
                const user_exist = await this.usersService.findUser(chatId);
                if (!user_exist)
                    return await this.bot.sendMessage(chatId, commandsMessage.notStarted());

                await this.bot.sendMessage(chatId, commandsMessage.setNativeLang(), nativeLangs);

                this.mode = null; // empty bot's mode
            } catch (error) {
                console.log(error);
            }
        });

        // show bot's skills -----------------------------------
        this.bot.onText(/\/options/, async (msg: any) => {
            const chatId = msg.chat.id;

            try {
                const user_exist = await this.usersService.findUser(chatId);
                if (!user_exist)
                    return await this.bot.sendMessage(chatId, commandsMessage.notStarted());

                if (!user_exist.nativeLang)
                    return await this.bot.sendMessage(chatId, commandsMessage.notSetNativeLang());

                await this.bot.sendMessage(chatId, commandsMessage.skillOptions(), skillOptions);
            } catch (error) {
                console.log(error);
            }
        });

        // show bot's mode -----------------------------------
        this.bot.onText(/\/showmode/, async (msg: any) => {
            const chatId = msg.chat.id;

            try {
                const user_exist = await this.usersService.findUser(chatId);
                if (!user_exist) return await this.bot.sendMessage(chatId, commandsMessage.notStarted());

                await this.bot.sendMessage(chatId, commandsMessage.botMode(this.mode));
            } catch (error) {
                console.log(error);
            }
        });

        // get the response of inline_keyboard and set the bot's status ----------------------------------
        this.bot.on("callback_query", async (query: any): Promise<void> => {
            const chatId = query.message.chat.id;
            const message_id = query.message.message_id;
            try {
                // delete the previous message of bot
                await this.bot.deleteMessage(chatId, message_id);

                // check the type of query data from user
                if (BotModeArray.includes(query.data))
                    this.setBotMode(chatId, query.data);

                else if (NativeLangsArray.includes(query.data))
                    await this.updateNativelang(chatId, query);

            } catch (error) {
                console.log(error);
            }
        });
    }

    // execute the logic code of each mode --------------------------------------------------------
    async executeProperMode(text: string): Promise<string | boolean | VocabularyResponseStruct> {
        switch (this.mode) {
            case BotMode.vocabulary_definition: return await this.botVocabularyAPI.vocabulary(text);
            case BotMode.text_to_speech: return await this.botTextToSpeech.textToSpeech(text, eventEmitter);
        }
    }

    // spread the response to the proper mode handler --------------------------------------------------
    async modeSpreader(msg: any, response: any): Promise<void> {
        switch (this.mode) {
            case BotMode.vocabulary_definition: return await this.vocabularyResponse(msg, response);
            case BotMode.text_to_speech: return await this.textToSpeechResponse(msg, response);
            case BotMode.translate_to_english: return await this.traslateToEnglishResponse(msg);
            case BotMode.translate_to_my_lang: return await this.traslateToMyLangResponse(msg);
        }
    }

    // send response to text to speech mode ----------------------------------------------
    async textToSpeechResponse(msg: any, filePath: string): Promise<void> {
        const chatId = msg.chat.id;
        let is_emitted: boolean = true; // prevent repeating the emit

        try {
            if (filePath) {
                const fileOptions = { filename: filePath, contentType: 'application/octet-stream' };
                await this.bot.sendMessage(chatId, 'Making the audio...');

                eventEmitter.on('send', async () => {
                    if (is_emitted) {
                        await this.bot.sendAudio(chatId, filePath, {}, fileOptions);

                        fs.unlink(filePath, () => { });
                        await this.bot.deleteMessage(chatId, (msg.message_id + 1));
                        is_emitted = false;
                    }
                });
            }
            else
                await this.bot.sendMessage(chatId, commandsMessage.isMaxVocabularies());
        } catch (error) {
            console.log(error);
        }
    }

    // send response to vocabulary mode -----------------------------------------------------
    async vocabularyResponse(msg: any, responseText: VocabularyResponseStruct): Promise<void> {
        const chatId = msg.chat.id;

        try {
            if (responseText) {
                responseText.responseText && await this.bot.sendMessage(chatId, responseText.responseText);
                responseText.audio && await this.bot.sendVoice(chatId, responseText.audio);
            }
            else
                await this.bot.sendMessage(chatId, commandsMessage.undefinedWord());
        } catch (error) {
            console.log(error);
        }
    }

    // ---------------------------------------------------
    async traslateToEnglishResponse(msg: any): Promise<void> {
        const chatId = msg.chat.id;
        const userText = msg.text;

        try {
            // translation
            const { text } = await translate(userText, { to: 'en' });
            await this.bot.sendMessage(chatId, text);
        } catch (error) {
            console.log(error);
        }
    }

    // --------------------------------------------------------
    async traslateToMyLangResponse(msg: any): Promise<void> {
        const chatId = msg.chat.id;
        const userText = msg.text;

        try {
            const user = await this.usersService.findUser(chatId)

            // translation
            const { text } = await translate(userText, { from: 'en', to: user?.nativeLang });
            await this.bot.sendMessage(chatId, text);
        } catch (error) {
            console.log(error);
        }
    }

    // check if bot mode is changing -------------------------------------
    setBotMode(chatId: number, mode: BotMode): void {
        this.mode = mode;

        // check the mode and send properiate message
        switch (this.mode) {
            case BotMode.vocabulary_definition:
                this.bot.sendMessage(chatId, commandsMessage.vocabularyMode());
                break;
            case BotMode.text_to_speech:
                this.bot.sendMessage(chatId, commandsMessage.textToSpeechMode());
                break;
            case BotMode.translate_to_my_lang:
                this.bot.sendMessage(chatId, commandsMessage.translateToMyLangMode());
                break;
            case BotMode.translate_to_english:
                this.bot.sendMessage(chatId, commandsMessage.translateToEnglishMode());
                break;
        }
    }

    // update native language ------------------------------------
    async updateNativelang(chatId: number, query: any) {
        // extract the native lang which user has sent
        const flat_existance_languages = query.message.reply_markup.inline_keyboard.flat(Infinity);
        const user_choosen_lang_array = flat_existance_languages.filter((item: any) => {
            if (item.callback_data === query.data) return item.text;
        });
        const user_lang: string = user_choosen_lang_array[0].text;

        // update the native lang
        const updated = await this.usersService.updateuserLang(query);
        if (updated)
            await this.bot.sendMessage(chatId, commandsMessage.langUpdated(user_lang));
        else
            await this.bot.sendMessage(chatId, commandsMessage.langUpdateFailed());
    }
}