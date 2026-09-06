import { TranslationRequest, TranslationResult } from '../types/translation';
import { LiveTranslator } from './translator';

export class TranslationManager {
  private translator: LiveTranslator;
  private defaultSourceLang: string = 'auto';
  private defaultTargetLang: string = 'es';

  constructor(endpointUrl?: string, defaultSourceLang?: string, defaultTargetLang?: string) {
    this.translator = new LiveTranslator(endpointUrl);
    if (defaultSourceLang) this.defaultSourceLang = defaultSourceLang;
    if (defaultTargetLang) this.defaultTargetLang = defaultTargetLang;
  }

  public setEndpointUrl(url: string): void {
    this.translator.setEndpointUrl(url);
  }

  public setDefaultLanguages(source: string, target: string): void {
    this.defaultSourceLang = source;
    this.defaultTargetLang = target;
  }

  public async translateText(
    text: string,
    sourceLang?: string,
    targetLang?: string
  ): Promise<TranslationResult> {
    const req: TranslationRequest = {
      text,
      sourceLang: sourceLang || this.defaultSourceLang,
      targetLang: targetLang || this.defaultTargetLang,
    };
    return this.translator.translate(req);
  }
}

export * from './translator';
