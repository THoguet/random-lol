import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ChampionRandomizerComponent } from './components/champion-randomizer.component';
import { ImagePreloadService } from './services/image-preload.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from './services/language.service';

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
	// Initialize services
	private readonly imagePreload = inject(ImagePreloadService);
	private readonly languageService = inject(LanguageService);
}
