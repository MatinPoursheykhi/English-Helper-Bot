export const Menu = [
    {
        command: "/start",
        description: "start working"
    },
    {
        command: "/nativelang",
        description: "set youe native language"
    },
    {
        command: "/options",
        description: "select an option"
    },
    {
        command: "/showmode",
        description: "show bot mode"
    },
]

export const skillOptions = {
    reply_markup: {
        // remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: [
            [
                {
                    text: 'Vocabulary Definition',
                    callback_data: 'Vocabulary Definition'
                },
                {
                    text: 'Text To Speech',
                    callback_data: 'Text To Speech'
                },
            ],
            [
                {
                    text: 'Translate My Language To English',
                    callback_data: 'Translate To English'
                },
            ],
            [
                {
                    text: 'Translate English To My Language',
                    callback_data: 'Translate To My Language'
                },
            ],
        ]
    }
}

export const nativeLangs = {
    reply_markup: {
        // remove_keyboard: true,
        one_time_keyboard: true,
        inline_keyboard: [
            [
                {
                    text: 'persian',
                    callback_data: 'fa'
                },
                {
                    text: 'French',
                    callback_data: 'fr'
                },
                {
                    text: 'German',
                    callback_data: 'de'
                },
            ],
            [
                {
                    text: 'Greek',
                    callback_data: 'el'
                },
                {
                    text: 'Afrikaans',
                    callback_data: 'af'
                },
                {
                    text: 'Albanian',
                    callback_data: 'sq'
                },
            ],
            [
                {
                    text: 'Chinese',
                    callback_data: 'zh-hk'
                },
                {
                    text: 'Japanese',
                    callback_data: 'ja'
                },
                {
                    text: 'Korean',
                    callback_data: 'ko'
                },
            ],
            [
                {
                    text: 'Russian',
                    callback_data: 'ru'
                },
                {
                    text: 'Spanish',
                    callback_data: 'es'
                },
                {
                    text: 'Swedish',
                    callback_data: 'sv'
                },
            ],
        ]
    }
}

