import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { PhoneticsStruct, VocabularyResponseStruct } from '../structs/bot.structs';

@Injectable()
export class BotVocabularyAPI {
    constructor(private readonly httpService: HttpService) { }

    // vocabulary definer
    async vocabulary(vocabulary: string): Promise<VocabularyResponseStruct | boolean> {
        const url: string = `https://api.dictionaryapi.dev/api/v2/entries/en/`;

        try {
            const { data } = await this.httpService.axiosRef.get(`${url}${vocabulary}`)
            // extract require data
            let phonetics: PhoneticsStruct = structuredClone(data[0]?.phonetics[0]);
            let meanings = await data.map((element: any) => element.meanings).flat(1);

            // create the structure of response
            const responseText = await responseMaker(meanings, phonetics, vocabulary);
            return responseText
        } catch (error) {
            return false;
        }
    }
}

// create the structure of response
async function responseMaker(meanings: any, phonetics: PhoneticsStruct | undefined, vocabulary: string) {
    let responseText = `Vocabulary: "${vocabulary}" ${phonetics.text ? `\nphonetic:${phonetics.text}` : ''}\n`

    meanings.forEach((items: any) => {

        // randomly choose a definition and example of definitions array
        const random = Math.floor(Math.random() * items.definitions.length)

        const part_of_speech = items.partOfSpeech
        const random_definition = items.definitions[random].definition
        const random_example = items.definitions[random].example
        const synonyms = items.synonyms
        const antonyms = items.antonyms

        // each space or tab is influence
        responseText += `\nPart of speech: ${part_of_speech} \nDefinition: ${random_definition} ${random_example ? `\nExample: ${random_example}` : ''} ${!!(items.synonyms.length) ? `\nSynonyms: ${synonyms}` : ''}${!!(items.antonyms.length) ? `\nAntonyms: ${antonyms}` : ''}\n`
    })
    const response: VocabularyResponseStruct = { responseText, audio: phonetics.audio }
    return response
}