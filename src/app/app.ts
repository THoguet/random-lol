import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ChampionRandomizerComponent } from './components/champion-randomizer.component';
import { ImagePreloadService } from './services/image-preload.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-root',
	imports: [
		MatToolbarModule,
		MatIconModule,
		MatCardModule,
		ChampionRandomizerComponent,
		TranslateModule,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './app.html',
	styleUrls: ['./app.css'],
})
export class App {
	// Initialize the image preload service
	private readonly imagePreload = inject(ImagePreloadService);
	private readonly translate = inject(TranslateService);

	constructor() {
		// Initialize language: prefer saved value, otherwise try the user's
		// browser language (navigator.languages / navigator.language), fall back to English.
		this.translate.setDefaultLang('en');
		let lang: string | null = null;
		try {
			lang = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null;
		} catch {
			// Ignore localStorage errors (e.g., in private browsing mode)
		}
		if (!lang && typeof navigator !== 'undefined') {
			const candidate =
				(navigator.languages && navigator.languages[0]) || navigator.language || '';
			if (candidate.startsWith('fr')) {
				lang = 'fr';
			} else {
				lang = 'en';
			}
		}
		this.translate.use(lang || 'en');
	}
}
