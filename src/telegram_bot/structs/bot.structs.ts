export interface PhoneticsStruct {
    text?: string,
    audio?: string,
    sourceUrl?: string,
    license?: LicenseStruct,
}
type LicenseStruct = {
    name: string,
    url: string
}

export interface VocabularyResponseStruct {
    responseText?: string,
    audio?: string
}