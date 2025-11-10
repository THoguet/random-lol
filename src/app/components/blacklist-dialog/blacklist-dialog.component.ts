import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { NgOptimizedImage } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RandomizerStateService } from '../../services/randomizer-state.service';
import { Lane } from '../../data/champions.data';

@Component({
	selector: 'app-blacklist-dialog',
	imports: [MatDialogModule, NgOptimizedImage, TranslateModule],
	templateUrl: './blacklist-dialog.component.html',
	styleUrl: './blacklist-dialog.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlacklistDialogComponent {
	protected readonly state = inject(RandomizerStateService);

	protected readonly lanes = this.state.lanes;

	laneLabel(lane: Lane): string {
		return this.state.laneLabel(lane);
	}

	getBlacklistedChampions(lane: Lane) {
		return this.state.blacklistedChampionsByLane().get(lane) || [];
	}
}
