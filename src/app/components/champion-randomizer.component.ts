import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LaneCardComponent } from './lane-card/lane-card.component';
import { ControlHeaderComponent } from './control-header/control-header.component';
import { RandomizerStateService } from '../services/randomizer-state.service';

@Component({
	selector: 'app-champion-randomizer',
	imports: [
		CommonModule,
		MatCardModule,
		MatIconModule,
		LaneCardComponent,
		ControlHeaderComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './champion-randomizer.component.html',
	styleUrl: './champion-randomizer.component.css',
})
export class ChampionRandomizerComponent {
	protected readonly state = inject(RandomizerStateService);
}
