import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	signal,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LANES, Lane, Champion } from './champions.data';
import { ChampionDataService } from './champion-data.service';

interface LaneAssignmentView {
	readonly lane: Lane;
	readonly champion: Champion | null;
	readonly rolesText: string;
}

@Component({
	selector: 'app-champion-randomizer',
	imports: [
		CommonModule,
		NgOptimizedImage,
		MatButtonModule,
		MatCardModule,
		MatChipsModule,
		MatIconModule,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './champion-randomizer.component.html',
	styleUrl: './champion-randomizer.component.css',
})
export class ChampionRandomizerComponent {
	private readonly championData = inject(ChampionDataService);
	private readonly laneTitleMap: Record<Lane, string> = {
		top: 'Top Lane',
		jungle: 'Jungle',
		mid: 'Mid Lane',
		adc: 'Bot Carry',
		support: 'Support',
	};

	private previousChampionStamp = '';

	protected readonly lanes = LANES;
	protected readonly champions = this.championData.champions;
	protected readonly championsByLane = this.championData.championsByLane;
	protected readonly isLoading = this.championData.loading;
	protected readonly loadError = this.championData.error;

	protected readonly hasChampions = computed(() => this.champions().length > 0);

	protected readonly assignments = signal<Record<Lane, Champion | null>>(
		this.createEmptyAssignments()
	);

	protected readonly laneAssignments = computed<LaneAssignmentView[]>(() =>
		this.lanes.map((lane) => {
			const champion = this.assignments()[lane];
			const rolesText = champion
				? champion.roles.map((role) => this.laneTitleMap[role]).join(', ')
				: '';

			return {
				lane,
				champion,
				rolesText,
			} satisfies LaneAssignmentView;
		})
	);

	protected readonly hasMissingChampion = computed(() =>
		this.lanes.some((lane) => this.assignments()[lane] === null)
	);

	constructor() {
		effect(() => {
			if (this.isLoading()) {
				return;
			}

			const champions = this.champions();
			if (champions.length === 0) {
				this.assignments.set(this.createEmptyAssignments());
				this.previousChampionStamp = '';
				return;
			}

			const stamp = champions.map((champion) => champion.id).join('|');
			if (stamp !== this.previousChampionStamp) {
				this.previousChampionStamp = stamp;
				this.rollAssignments();
			}
		});

		void this.championData.ensureLoaded();
	}

	protected rollAssignments(): void {
		const championsByLaneMap = this.championsByLane();

		if (championsByLaneMap.size === 0) {
			this.assignments.set(this.createEmptyAssignments());
			return;
		}

		const selected = new Set<string>();
		const result = this.createEmptyAssignments();

		for (const lane of this.lanes) {
			const candidates = (championsByLaneMap.get(lane) || []).filter(
				(champion) => !selected.has(champion.name)
			);

			if (candidates.length === 0) {
				result[lane] = null;
				continue;
			}

			const champion = candidates[Math.floor(Math.random() * candidates.length)];
			result[lane] = champion;
			selected.add(champion.name);
		}

		this.assignments.set(result);
	}

	protected retryLoad(): void {
		void this.championData.reload();
	}

	protected laneLabel(lane: Lane): string {
		return this.laneTitleMap[lane];
	}

	protected roleLabel(role: Lane): string {
		return this.laneTitleMap[role];
	}

	private createEmptyAssignments(): Record<Lane, Champion | null> {
		return {
			top: null,
			jungle: null,
			mid: null,
			adc: null,
			support: null,
		} satisfies Record<Lane, Champion | null>;
	}

	changeChampion(arg0: string) {
		throw new Error('Method not implemented.');
	}
}
