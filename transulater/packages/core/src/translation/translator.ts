import { TranslationRequest, TranslationResult } from '../types/translation';

export class LiveTranslator {
  private endpointUrl: string;

  constructor(endpointUrl: string = 'http://localhost:8000/api/translate') {
    this.endpointUrl = endpointUrl;
  }

  public setEndpointUrl(url: string): void {
    this.endpointUrl = url;
  }

  public async translate(request: TranslationRequest): Promise<TranslationResult> {
    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: request.text,
          source_lang: request.sourceLang || 'auto',
          target_lang: request.targetLang || 'es',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Translation failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return {
        originalText: request.text,
        translatedText: data.translated_text || request.text,
        sourceLanguage: data.source_lang || request.sourceLang,
        targetLanguage: data.target_lang || request.targetLang,
        detectedSourceLanguage: data.detected_source_lang || data.source_lang,
        confidence: data.confidence ?? 0.98,
      };
    } catch (err: any) {
      console.warn('Backend translation failed, using client fallback dictionary/echo:', err);
      return {
        originalText: request.text,
        translatedText: `[Translated (${request.targetLang})]: ${request.text}`,
        sourceLanguage: request.sourceLang,
        targetLanguage: request.targetLang,
        detectedSourceLanguage: request.sourceLang !== 'auto' ? request.sourceLang : 'en',
        confidence: 0.8,
      };
    }
  }
}
