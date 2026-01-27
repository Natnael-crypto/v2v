export interface TranslationResult {
  language: string;
  text: string;
  audioBase64: string;
}

export interface ProcessResponse {
  sourceLanguage: string;
  originalTranscript: string;
  originalAudioBase64?: string;
  translations: TranslationResult[];
}
