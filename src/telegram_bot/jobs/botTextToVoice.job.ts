import { Injectable } from "@nestjs/common";
const Gtts = require('gtts');

@Injectable()
export class BotTextToSpeechJOB {

    async textToSpeech(text: string, eventEmitter: any): Promise<string | boolean> {
        const max_allow_vocabularies: number = 44;
        const text_vocabularies = text.split(' ').length;
        const filePath: string = `Voice.mp3`;

        if (text_vocabularies <= max_allow_vocabularies) {
            // convert the text to speech
            const speech = await new Gtts(text, 'en');
            // save the voice
            await speech.save(filePath, async () => { await eventEmitter.emit('send') });
            return filePath
        } else
            return false;
    }
}
