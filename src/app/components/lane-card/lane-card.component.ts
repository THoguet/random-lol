import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Lane } from '../../data/champions.data';
import { RandomizerStateService } from '../../services/randomizer-state.service';

@Component({
	selector: 'app-lane-card',
	imports: [NgOptimizedImage, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './lane-card.component.html',
	styleUrl: './lane-card.component.css',
})
export class LaneCardComponent {
	protected readonly state = inject(RandomizerStateService);

	lane = input.required<Lane>();

	// Computed values derived from state and lane
	protected readonly laneLabel = computed(() => this.state.laneLabel(this.lane()));
	protected readonly champion = computed(() => this.state.assignments().get(this.lane()) || null);
	protected readonly canReRoll = computed(() => this.state.reRollBank() > 0);
	protected readonly disabled = computed(() => this.state.disabledLanes().has(this.lane()));

	onChangeChampion(forceReroll = false): void {
		this.state.changeChampion(this.lane(), forceReroll);
	}

	onToggleDisableLane(): void {
		this.state.toggleLane(this.lane());
	}

	roleLabel(role: Lane): string {
		return this.state.roleLabel(role);
	}
}
