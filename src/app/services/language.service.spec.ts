import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
	let service: LanguageService;
	let translateService: TranslateService;

	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();

		TestBed.configureTestingModule({
			imports: [TranslateModule.forRoot()],
			providers: [LanguageService, provideZonelessChangeDetection()],
		});

		service = TestBed.inject(LanguageService);
		translateService = TestBed.inject(TranslateService);
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should initialize with default language', () => {
		expect(service.currentLang()).toBe('en');
	});

	it('should change language', () => {
		service.setLanguage('fr');
		expect(service.currentLang()).toBe('fr');

		// Flush effects to ensure the effect runs
		TestBed.flushEffects();

		// In zoneless mode, we need to check if translate was called
		expect(translateService.currentLang).toBe('fr');
	});

	it('should persist language to localStorage', (done) => {
		// Flush effects to ensure initialization is complete
		TestBed.flushEffects();

		service.setLanguage('zh');
		expect(service.currentLang()).toBe('zh');

		// Flush effects after setting the language to trigger the storedSignal effect
		TestBed.flushEffects();

		// Wait for debounce (300ms + buffer)
		setTimeout(() => {
			const stored = localStorage.getItem('app.language');
			expect(stored).toBe('"zh"');
			done();
		}, 400);
	});

	it('should restore language from localStorage', () => {
		localStorage.setItem('app.language', '"fr"');

		// Create a new TestBed instance to test restoration
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			imports: [TranslateModule.forRoot()],
			providers: [LanguageService, provideZonelessChangeDetection()],
		});

		const newService = TestBed.inject(LanguageService);
		expect(newService.currentLang()).toBe('fr');
	});

	it('should sync with TranslateService', () => {
		// The service uses the translate service in constructor and via effect
		// In tests, just verify the current language matches
		expect(translateService.currentLang).toBe(service.currentLang());

		service.setLanguage('zh');
		expect(service.currentLang()).toBe('zh');

		// Flush effects to ensure the effect runs
		TestBed.flushEffects();

		// The effect should update the translate service in the next change detection
		expect(translateService.currentLang).toBe('zh');
	});
});
