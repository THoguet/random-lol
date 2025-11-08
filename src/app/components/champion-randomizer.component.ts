import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { LANES, Lane, Champion } from '../data/champions.data';
import { ChampionDataService } from '../services/champion-data.service';
import { LaneCardComponent } from './lane-card/lane-card.component';
import { ControlHeaderComponent } from './control-header/control-header.component';
import { RandomNumber } from '../services/random-number';

interface LaneAssignmentView {
	readonly lane: Lane;
	readonly champion: Champion | null;
	readonly rolesText: string;
}

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
	private readonly championData = inject(ChampionDataService);
	private readonly laneTitleMap: Record<Lane, string> = {
		top: 'Top Lane',
		jungle: 'Jungle',
		mid: 'Mid Lane',
		adc: 'Bot Carry',
		support: 'Support',
	};

	public canReRoll = signal<Map<Lane, number | undefined>>(
		new Map([
			['top', undefined],
			['jungle', undefined],
			['mid', undefined],
			['adc', undefined],
			['support', undefined],
		])
	);

	public disabledLanes = signal<Set<Lane>>(new Set());

	private previousChampionStamp = '';
	protected readonly isShiftPressed = signal<boolean>(false);

	protected readonly lanes = LANES;
	protected readonly champions = this.championData.champions;
	protected readonly championsByLane = this.championData.championsByLane;
	protected readonly isLoading = this.championData.loading;
	protected readonly loadError = this.championData.error;

	protected readonly hasChampions = computed(() => this.champions().length > 0);

	protected readonly assignments = signal<Map<Lane, Champion | null>>(
		this.createEmptyAssignments()
	);

	protected readonly disabledLanesArray = computed(() => {
		return Array.from(this.disabledLanes());
	});

	protected readonly activatedLanesArray = computed(() => {
		return this.lanes.filter((lane) => !this.disabledLanes().has(lane));
	});

	protected readonly assignmentsArray = computed(() => {
		const result: (Champion | null)[] = [];
		for (const lane of this.lanes) {
			result.push(this.assignments().get(lane) || null);
		}
		return result;
	});

	protected readonly usedChampions = computed<Map<Lane, Champion | null>>(() => {
		const used = new Map<Lane, Champion | null>();

		for (const lane of this.lanes) {
			const champion = this.assignments().get(lane);
			used.set(lane, champion || null);
		}

		return used;
	});

	protected readonly notUsedChampions = computed<Map<Lane, Champion[]>>(() => {
		const notUsed = new Map<Lane, Champion[]>();

		for (const lane of this.lanes) {
			const champion =
				this.championsByLane()
					.get(lane)
					?.filter(
						(champion) =>
							!this.assignmentsArray().some(
								(assignedChampion) =>
									assignedChampion && assignedChampion.name === champion.name
							)
					) || [];
			notUsed.set(lane, champion);
		}

		return notUsed;
	});

	protected readonly laneAssignments = computed<LaneAssignmentView[]>(() =>
		this.lanes.map((lane) => {
			const champion = this.assignments().get(lane) || null;
			const rolesText = champion
				? champion.roles.map((role: Lane) => this.laneTitleMap[role]).join(', ')
				: '';

			return {
				lane,
				champion,
				rolesText,
			} satisfies LaneAssignmentView;
		})
	);

	protected readonly canCopyDraft = computed<boolean>(() => {
		return this.laneAssignments().some((assignment) => assignment.champion !== null);
	});

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

		// Track Shift key state
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', (event) => {
				if (event.key === 'Shift') {
					this.isShiftPressed.set(true);
				}
			});

			window.addEventListener('keyup', (event) => {
				if (event.key === 'Shift') {
					this.isShiftPressed.set(false);
				}
			});
		}
	}

	// 1/2 chance to update canReRoll to true/false
	protected tryReroll(lane: Lane): void {
		const current = this.canReRoll().get(lane);
		if (current === undefined) {
			// check if this lane was disabled by checking assignments
			const isDisabled = this.assignments().get(lane) === null;
			if (isDisabled) {
				// give free reroll if lane was disabled
				this.changeChampion(lane, true);
				this.canReRoll.update((state) => {
					const newState = new Map(state);
					newState.set(lane, undefined);
					return newState;
				});
				return;
			}

			const newValue = RandomNumber.getSecureRandomInt(2) === 0 ? 1 : 0;
			this.canReRoll.update((state) => {
				const newState = new Map(state);
				newState.set(lane, newValue);
				return newState;
			});
		}
	}

	protected rollAssignments(): void {
		const championsByLaneMap = this.notUsedChampions();

		this.canReRoll.set(
			new Map([
				['top', undefined],
				['jungle', undefined],
				['mid', undefined],
				['adc', undefined],
				['support', undefined],
			])
		);

		if (championsByLaneMap.size === 0) {
			this.assignments.set(this.createEmptyAssignments());
			return;
		}

		const selected = new Set<string>();
		const result = this.createEmptyAssignments();

		for (const lane of this.activatedLanesArray()) {
			const candidates = (championsByLaneMap.get(lane) || []).filter(
				(champion: Champion) => !selected.has(champion.name)
			);

			if (candidates.length === 0) {
				result.set(lane, null);
				continue;
			}

			const champion = candidates[RandomNumber.getSecureRandomInt(candidates.length + 1) - 1];
			result.set(lane, champion);
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

	private createEmptyAssignments(): Map<Lane, Champion | null> {
		return new Map([
			['top', null],
			['jungle', null],
			['mid', null],
			['adc', null],
			['support', null],
		]);
	}

	public changeChampion(lane: Lane, forceReroll = false): void {
		// Allow reroll if Shift is pressed or if canReRoll is true
		const canReroll = this.canReRoll().get(lane);
		if (!forceReroll && canReroll && canReroll < 1) {
			return;
		}

		const newValue = canReroll && canReroll > 0 ? canReroll - 1 : 0;

		this.canReRoll.update((current) => {
			const newState = new Map(current);
			newState.set(lane, newValue);
			return newState;
		});
		const notUsedChampionsForLane = this.notUsedChampions().get(lane);
		if (!notUsedChampionsForLane) {
			return;
		}

		const champion =
			notUsedChampionsForLane[
				RandomNumber.getSecureRandomInt(notUsedChampionsForLane.length + 1) - 1
			];
		this.assignments.update((current) => {
			const newState = new Map(current);
			newState.set(lane, champion);
			return newState;
		});
	}

	public toggleLane(lane: Lane): void {
		this.disabledLanes.update((current) => {
			const newSet = new Set(current);
			if (newSet.has(lane)) {
				newSet.delete(lane);
			} else {
				newSet.add(lane);
			}
			return newSet;
		});
		this.assignments.update((current) => {
			const newState = new Map(current);
			newState.set(lane, null);
			return newState;
		});
	}

	public async copyDraftToClipboard(): Promise<void> {
		const draftText =
			'‎\n' +
			this.laneAssignments()
				.filter((assignment) => assignment.champion !== null)
				.map((assignment) => {
					const laneLabel = this.laneLabel(assignment.lane);
					const championName = assignment.champion?.name || 'No champion';
					const rerollStatus = this.canReRoll().get(assignment.lane);
					const rerollText =
						rerollStatus === undefined
							? 'reroll available'
							: rerollStatus > 0
							? 'reroll available'
							: 'no reroll';

					return `${laneLabel} - "${championName}" | ${rerollText}`;
				})
				.join('\n');

		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(draftText);
			} catch (error) {
				console.error('Failed to copy draft to clipboard:', error);
			}
		}
	}
}
