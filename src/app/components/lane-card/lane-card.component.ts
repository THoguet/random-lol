import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Champion, Lane } from '../../data/champions.data';

@Component({
	selector: 'app-lane-card',
	imports: [NgOptimizedImage, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './lane-card.component.html',
	styleUrl: './lane-card.component.css',
})
export class LaneCardComponent {
	lane = input.required<Lane>();
	laneLabel = input.required<string>();
	champion = input<Champion | null>(null);
	canReRoll = input<boolean>(false);
	isLoading = input<boolean>(false);
	hasChampions = input<boolean>(false);
	isShiftPressed = input<boolean>(false);
	disabled = input<boolean>(false);

	changeChampion = output<{ lane: Lane; forceReroll: boolean }>();
	toggleDisableLane = output<Lane>();

	roleLabel(role: Lane): string {
		const laneTitleMap: Record<Lane, string> = {
			top: 'Top Lane',
			jungle: 'Jungle',
			mid: 'Mid Lane',
			adc: 'Bot Carry',
			support: 'Support',
		};
		return laneTitleMap[role];
	}

	onChangeChampion(forceReroll = false): void {
		this.changeChampion.emit({ lane: this.lane(), forceReroll });
	}

	onToggleDisableLane(): void {
		this.toggleDisableLane.emit(this.lane());
	}
}
