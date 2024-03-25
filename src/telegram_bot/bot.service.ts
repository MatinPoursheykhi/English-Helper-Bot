import { Injectable, OnModuleInit } from "@nestjs/common";
import { commandsMessage, BotStatus, NativeLangsArray, BotStatusArray } from "./constants/bot.constants";
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
    public mode: BotStatus;

    constructor(
        private readonly usersService: UsersService,
        private readonly commandHandler: CommandHandlerJOB,
        private readonly botVocabularyAPI: BotVocabularyAPI,
        private readonly botTextToSpeech: BotTextToSpeechJOB,
    ) { }

    async onModuleInit() {
        // MENU -------------------------------------------------------
        await this.bot.setMyCommands(Menu);
        
        // Listening to user's messages and manage most of the bot reactions ----------------------------------------------------------
        await this.bot.on('message', async (msg: any): Promise<void> => {
            const chatId = msg.chat.id;
            const text = msg.text;
            const is_command: Array<Object> | undefined = msg.entities;
            
            try {    
                    // if user have not click on /start -----------------------------------------
                const user_exist = await this.usersService.findUser(chatId);
                if(!user_exist && !is_command)
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
                else{
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
        await this.bot.onText(/\/start/, async (msg: any) => {
            const chatId = msg.chat.id; 
            const { chat } = msg;

            try {
                // check if user exists ----------------------------
                const user_exist = await this.usersService.findUser(chatId);
                if (!user_exist)
                    await this.usersService.create(chat);

                await this.bot.sendMessage(chatId, commandsMessage.start(msg.from.first_name));
            } catch (error) {
                console.log(error);
            }
        });

        // set the user native lang--------------------
        await this.bot.onText(/\/nativelang/, async (msg: any) => {
            const chatId = msg.chat.id;
            
            try {
                const user_exist = await this.usersService.findUser(chatId);
                if(!user_exist)
                    return await this.bot.sendMessage(chatId, commandsMessage.notStarted());
    
                await this.bot.sendMessage(chatId, commandsMessage.setNativeLang(), nativeLangs);
            } catch (error) {
                console.log(error);
            }
        });

        // show bot's skills -----------------------------------
        await this.bot.onText(/\/options/, async (msg: any) => {
            const chatId = msg.chat.id;

            try {
                const user_exist = await this.usersService.findUser(chatId);
                if(!user_exist)
                    return await this.bot.sendMessage(chatId, commandsMessage.notStarted());
                else if (!user_exist.nativeLang)
                    return await this.bot.sendMessage(chatId, commandsMessage.notSetNativeLang());

                await this.bot.sendMessage(chatId, commandsMessage.skillOptions(), skillOptions);
            } catch (error) {
                console.log(error);
            }
        });

        // show bot's mode -----------------------------------
        await this.bot.onText(/\/showmode/, async (msg: any) => {
            const chatId = msg.chat.id;

            try {
                const user_exist = await this.usersService.findUser(chatId);
                if(!user_exist) return await this.bot.sendMessage(chatId, commandsMessage.notStarted());

                await this.bot.sendMessage(chatId, commandsMessage.botMode(this.mode));
            } catch (error) {
                console.log(error);
            }
        });

        // get the response of inline_keyboard and set the bot's status ----------------------
        await this.bot.on("callback_query", async (query: any): Promise<void> => {
            const chatId = query.message.chat.id;
            const message_id = query.message.message_id;
        try {
            // delete the previous message of bot
            await this.bot.deleteMessage(chatId, message_id);
            
            // check the type of query data from user
            if(BotStatusArray.includes(query.data)){
                this.mode = query.data;
                // check the mode and send properiate message
                if (this.mode === BotStatus.vocabulary_definition)
                    await this.bot.sendMessage(chatId, commandsMessage.vocabularyMode());
                else if (this.mode === BotStatus.text_to_speech)
                    await this.bot.sendMessage(chatId, commandsMessage.textToSpeechMode());
                else if (this.mode === BotStatus.translate_to_my_lang)
                    await this.bot.sendMessage(chatId, commandsMessage.translateToMyLangMode());
                else if (this.mode === BotStatus.translate_to_english)
                    await this.bot.sendMessage(chatId, commandsMessage.translateToEnglishMode());
            }
            else if(NativeLangsArray.includes(query.data)){
                const flat_existance_languages = query.message.reply_markup.inline_keyboard.flat(Infinity);
                const user_choosen_lang_array = flat_existance_languages.filter((item: any)=> {
                    if(item.callback_data === query.data) return item.text;
                });
                const user_lang: string = user_choosen_lang_array[0].text;

                const updated = await this.usersService.updateuserLang(query);
                if(updated)
                    await this.bot.sendMessage(chatId, commandsMessage.langUpdated(user_lang));
                else
                    await this.bot.sendMessage(chatId, commandsMessage.langUpdateFailed());
            }
        } catch (error) {
            console.log(error);
        }
        });
    }

    // execute the logic code of each mode
    async executeProperMode(text: string) {
        switch (this.mode) {
            case BotStatus.vocabulary_definition: return await this.botVocabularyAPI.vocabulary(text);
            case BotStatus.text_to_speech: return await this.botTextToSpeech.textToSpeech(text, eventEmitter);
        }
    }

    // spread the response to the proper mode handler
    async modeSpreader(msg: any, response: any){
        switch (this.mode) {
            case BotStatus.vocabulary_definition: return await this.vocabularyResponse(msg, response);
            case BotStatus.text_to_speech: return await this.textToSpeechResponse(msg, response);
            case BotStatus.translate_to_english: return await this.traslateToEnglishResponse(msg);
            case BotStatus.translate_to_my_lang: return await this.traslateToMyLangResponse(msg);
        }
    }

    // send response to text to speech mode
    async textToSpeechResponse(msg: any, filePath: string){
        const chatId = msg.chat.id;
        let is_emitted: boolean = true;
        
        try {
            if(filePath){
                const fileOptions = { filename: filePath, contentType: 'audio/mpeg' };
                await this.bot.sendMessage(chatId, 'Making the audio...');

                eventEmitter.on('send', async ()=>{
                    if(is_emitted){
                        await this.bot.sendAudio(chatId, filePath, {}, fileOptions);

                        fs.unlink(filePath,()=>{});
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

    // send response to vocabulary mode
    async vocabularyResponse(msg: any, responseText: VocabularyResponseStruct){
        const chatId = msg.chat.id;
        
        try {
        if(responseText){
            responseText.responseText && await this.bot.sendMessage(chatId, responseText.responseText);
            responseText.audio && await this.bot.sendVoice(chatId, responseText.audio);
        } 
        else
            await this.bot.sendMessage(chatId,  commandsMessage.undefinedWord());
        } catch (error) {
            console.log(error);
        }
    }

    async traslateToEnglishResponse(msg: any) {
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
    
    async traslateToMyLangResponse(msg: any) {
        const chatId = msg.chat.id;
        const userText = msg.text;

        try {
            const user = await this.usersService.findUser(chatId)

            // translation
            const { text } = await translate(userText, { from:'en', to: user?.nativeLang });
            await this.bot.sendMessage(chatId, text);
        } catch (error) {
            console.log(error);
        }
    }
}
























        // get user native language
        // await this.bot.onText(/\/myLanguage/, async (text: any) => {
        //     const chatId = msg.chat.id
        //     // force reply
        //     await this.bot.sendMessage(chatId, commandsMessage.myLanguage(), {
        //         reply_markup: {
        //             force_reply: true,
        //         }
        //     })
        //     // lang options
        //     await this.bot.sendMessage(chatId, commandsMessage.chooseOneLang(), {
        //         reply_markup: {
        //             keyboard: [...languages],
        //             resize_keyboard: true, // make buttons smaller
        //             one_time_keyboard: true, // will be shown just for the first time
        //         }
        //     })

        // replys on users message
        // await this.bot.onReplyToMessage(msg.chat.id, msg.message_id, (res: any) => {
        //     console.log(res);
        // })
        // updateUser(msg)
        // });

        // Bot Buttons ------------------------------------------------------------------------------
        // await this.bot.on("inline_query", async (msg: any) => {
        //     console.log(msg);
        //     // const message_id: number = msg.message_id
        //     // await this.bot.deleteMessage(msg.chat_id, (message_id - 1)) // delete the message
        //     // await this.bot.removeListener("message");
        // });

    // this.bot.onReplyToMessage(chatId, messageId, async (nameMsg) => {
    //     const name = nameMsg.text;
    //     // save name in DB if you want to ...
    // })

    //reply_to_message_id 
    //this.bot.onText => the first param is our command and the second param is an arrow function that we can do respond to that command

    // this.bot.channel_post => Received a new incoming channel post of any kind
    // this.bot.edited_channel_post, edited_channel_post_text, edited_channel_post_caption => Received a new version of a channel post that is known to the bot and was edited

    // this.bot.edited_message, edited_message_text, edited_message_caption => Received a new version of a message that is known to the bot and was edited
    // check bot's this.mode and utilizing the fit function

