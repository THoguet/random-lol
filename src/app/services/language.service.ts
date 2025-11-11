import { Injectable, inject, Injector, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { storedSignal } from '../shared/utils/stored-signal';

/**
 * Service to manage language preferences with persistence to localStorage.
 * Uses storedSignal to automatically save and restore the selected language.
 */
@Injectable({
	providedIn: 'root',
})
export class LanguageService {
	private readonly translate = inject(TranslateService);
	private readonly injector = inject(Injector);

	// Store language preference using storedSignal
	public readonly currentLang = storedSignal<string>(
		'app.language',
		this.getInitialLanguage(),
		this.injector,
	);

	constructor() {
		// Set default language
		this.translate.setDefaultLang('en');

		// Use the stored language
		this.translate.use(this.currentLang());

		// Sync language changes to translate service
		effect(() => {
			this.translate.use(this.currentLang());
		});
	}

	/**
	 * Change the current language
	 */
	public setLanguage(lang: string): void {
		this.currentLang.set(lang);
	}

	/**
	 * Get the initial language based on browser preferences or old localStorage key
	 */
	private getInitialLanguage(): string {
		// Check for saved language in old key (for backward compatibility)
		if (typeof localStorage !== 'undefined') {
			try {
				const savedLang = localStorage.getItem('lang');
				if (savedLang) {
					// Clean up old key
					localStorage.removeItem('lang');
					return savedLang;
				}
			} catch {
				// Ignore localStorage errors
			}
		}

		// Detect browser language
		if (typeof navigator !== 'undefined') {
			const candidate =
				(navigator.languages && navigator.languages[0]) || navigator.language || '';
			if (candidate.startsWith('fr')) {
				return 'fr';
			} else if (candidate.startsWith('zh')) {
				return 'zh';
			}
		}

		return 'en';
	}
}
