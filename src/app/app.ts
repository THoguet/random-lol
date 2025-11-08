import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ChampionRandomizerComponent } from './components/champion-randomizer.component';
import { ImagePreloadService } from './services/image-preload.service';

@Component({
	selector: 'app-root',
	imports: [MatToolbarModule, MatIconModule, MatCardModule, ChampionRandomizerComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './app.html',
	styleUrls: ['./app.css'],
})
export class App {
	// Initialize the image preload service
	private readonly imagePreload = inject(ImagePreloadService);
}
