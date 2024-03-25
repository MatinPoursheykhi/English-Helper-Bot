export const commandsMessage = {
    start: (username: string): string => `Hey ${username ? username : 'pal'}!\nWelcome to English Helper Bot!\nPlease tap on /nativelang command to set your native language!`,
    notStarted: (): string => `Please use /start first.`,

    setNativeLang: (): string => `Please choose your native language!`,
    notSetNativeLang: (): string => `Please choose your native language!\n Use /nativelang`,
    langUpdated: (user_lang: string): string => `Your native language has been updated to "${user_lang.toLocaleUpperCase()}"!\nNow you can continue with /options command.`,
    langUpdateFailed: (): string => `Something went wrong\nUpdate failed.`,

    undefinedCommand: (): string => `Command is not valid`,

    skillOptions: (): string => `Which option do you want to use?`,

    vocabularyMode: (): string => `Consideration:\nIn "Vocabulary Definition" mode you can send one word in your each query!\nBe aware that some vocabularies may not have the pronunciation voice.`,
    undefinedWord: (): string => `Sorry pal, we couldn't find definitions for the word you were looking for.`,

    noMode: (): string => `Please select an option via /options!`,
    botMode: (mode: string): string => `Bot mode is: ${mode ? mode : "nothing"}!`,

    textToSpeechMode: (): string => `Consideration:\nIn "Text To Speech" mode you can use a maximum of 44 word in each query!`,
    isMaxVocabularies: (): string => `You have used more than 44 word!\nPlease send less.`,

    translateToMyLangMode: (): string => `Consideration:\nIn "Translate English To My Language" mode you can translate any vocabularies or sentences from English to your native language!`,
    translateToEnglishMode: (): string => `Consideration:\nIn "Translate My Language To English" mode you can translate any vocabularies or sentences from your native language to English!`,

}

// existance commands
export const commandCodes = ['/start', '/options', '/showmode', '/nativelang'];

export const enum BotMode {
    vocabulary_definition = 'Vocabulary Definition',
    text_to_speech = 'Text To Speech',
    translate_to_my_lang = 'Translate To My Language',
    translate_to_english = 'Translate To English',
}

export const BotModeArray = ['Vocabulary Definition', 'Text To Speech', 'Translate To English', 'Translate To My Language']
export const NativeLangsArray = ['fa', 'fr', 'de', 'el', 'af', 'sq', 'zh-hk', 'ja', 'ko', 'ru', 'es', 'sv']