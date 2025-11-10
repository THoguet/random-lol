import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Champion, Lane, LANES } from '../data/champions.data';
import { ChampionDataService } from './champion-data.service';
import { RandomNumber } from './random-number';

interface LaneAssignmentView {
	readonly lane: Lane;
	readonly champion: Champion | null;
	readonly rolesText: string;
}

@Injectable({
	providedIn: 'root',
})
export class RandomizerStateService {
	private readonly championData = inject(ChampionDataService);
	private readonly laneTitleMap: Record<Lane, string> = {
		top: 'Top Lane',
		jungle: 'Jungle',
		mid: 'Mid Lane',
		adc: 'Bot Carry',
		support: 'Support',
	};

	private previousChampionStamp = '';

	// Core state signals
	public readonly disabledLanes = signal<Set<Lane>>(new Set());
	public readonly isShiftPressed = signal<boolean>(false);
	public readonly reRollBank = signal<number>(0);
	public readonly reRollBankMax = signal<number>(0);
	public readonly showAndy = signal<boolean>(false);
	public readonly blacklistedChampions = signal<Set<string>>(new Set());
	public readonly fearlessDraftEnabled = signal<boolean>(true);
	public readonly assignments = signal<Map<Lane, Champion | null>>(this.createEmptyAssignments());

	// Computed values from champion data service
	public readonly lanes = LANES;
	public readonly champions = computed(() => this.championData.champions());
	public readonly championsByLane = computed(() => this.championData.championsByLane());
	public readonly isLoading = computed(() => this.championData.loading());
	public readonly loadError = computed(() => this.championData.error());
	public readonly hasChampions = computed(() => this.champions().length > 0);

	// Computed derived state
	public readonly disabledLanesArray = computed(() => {
		return Array.from(this.disabledLanes());
	});

	public readonly activatedLanesArray = computed(() => {
		return this.lanes.filter((lane) => !this.disabledLanes().has(lane));
	});

	public readonly assignmentsArray = computed(() => {
		const result: (Champion | null)[] = [];
		for (const lane of this.lanes) {
			result.push(this.assignments().get(lane) || null);
		}
		return result;
	});

	public readonly usedChampions = computed<Map<Lane, Champion | null>>(() => {
		const used = new Map<Lane, Champion | null>();

		for (const lane of this.lanes) {
			const champion = this.assignments().get(lane);
			used.set(lane, champion || null);
		}

		return used;
	});

	public readonly notUsedChampions = computed<Map<Lane, Champion[]>>(() => {
		const notUsed = new Map<Lane, Champion[]>();
		const blacklisted = this.blacklistedChampions();

		for (const lane of this.lanes) {
			const champion =
				this.championsByLane()
					.get(lane)
					?.filter(
						(champion) =>
							!this.assignmentsArray().some(
								(assignedChampion) =>
									assignedChampion && assignedChampion.name === champion.name,
							) && !blacklisted.has(champion.name),
					) || [];
			notUsed.set(lane, champion);
		}

		return notUsed;
	});

	public readonly blacklistedChampionsByLane = computed<Map<Lane, Champion[]>>(() => {
		const blacklisted = this.blacklistedChampions();
		const result = new Map<Lane, Champion[]>();

		for (const lane of this.lanes) {
			const championsForLane =
				this.championsByLane()
					.get(lane)
					?.filter((champion) => blacklisted.has(champion.name)) || [];
			result.set(lane, championsForLane);
		}

		return result;
	});

	public readonly laneAssignments = computed<LaneAssignmentView[]>(() =>
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
		}),
	);

	public readonly canCopyDraft = computed<boolean>(() => {
		return this.laneAssignments().some((assignment) => assignment.champion !== null);
	});

	public readonly rerollPercentage = computed<number>(() => {
		if (this.reRollBankMax() === 0) {
			return 0;
		}
		return (this.reRollBank() / this.reRollBankMax()) * 100;
	});

	constructor() {
		// Auto-roll when champions load or change
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

			window.addEventListener('keydown', (event) => {
				if (event.key.toLowerCase() === 'g' && event.ctrlKey && event.altKey) {
					this.showAndy.update((current) => !current);
				}
			});
		}
	}

	// Actions
	public rollAssignments(): void {
		const championsByLaneMap = this.notUsedChampions();

		this.reRollBank.set(this.activatedLanesArray().length);
		this.reRollBankMax.set(this.activatedLanesArray().length);

		if (championsByLaneMap.size === 0) {
			this.assignments.set(this.createEmptyAssignments());
			return;
		}

		const selected = new Set<string>();
		const result = this.createEmptyAssignments();

		for (const lane of this.activatedLanesArray()) {
			const candidates = (championsByLaneMap.get(lane) || []).filter(
				(champion: Champion) => !selected.has(champion.name),
			);

			if (candidates.length === 0) {
				result.set(lane, null);
				continue;
			}

			const champion = candidates[RandomNumber.getSecureRandomInt(candidates.length)];
			result.set(lane, champion);
			selected.add(champion.name);
		}

		this.assignments.set(result);

		// Add selected champions to blacklist for fearless draft (if enabled)
		if (this.fearlessDraftEnabled()) {
			this.blacklistedChampions.update((current) => {
				const updated = new Set(current);
				selected.forEach((championName) => updated.add(championName));
				return updated;
			});
		}
	}

	public retryLoad(): void {
		void this.championData.reload();
	}

	public laneLabel(lane: Lane): string {
		return this.laneTitleMap[lane];
	}

	public roleLabel(role: Lane): string {
		return this.laneTitleMap[role];
	}

	public changeChampion(lane: Lane, forceReroll = false): void {
		// Allow reroll if Shift is pressed or if canReRoll is true
		if (!forceReroll && this.reRollBank() && this.reRollBank() < 1) {
			return;
		}

		this.reRollBank.set(this.reRollBank() - 1);
		const notUsedChampionsForLane = this.notUsedChampions().get(lane);
		if (!notUsedChampionsForLane) {
			return;
		}

		const number = RandomNumber.getSecureRandomInt(notUsedChampionsForLane.length);

		const champion = notUsedChampionsForLane[number];

		// Get the old champion to remove from blacklist if being replaced
		const oldChampion = this.assignments().get(lane);

		this.assignments.update((current) => {
			const newState = new Map(current);
			newState.set(lane, champion);
			return newState;
		});

		// Update blacklist only when fearless draft is enabled
		if (this.fearlessDraftEnabled()) {
			this.blacklistedChampions.update((current) => {
				const updated = new Set(current);
				if (oldChampion) {
					updated.delete(oldChampion.name);
				}
				updated.add(champion.name);
				return updated;
			});
		}
	}

	public toggleLane(lane: Lane): void {
		this.disabledLanes.update((current) => {
			const newSet = new Set(current);
			if (newSet.has(lane)) {
				newSet.delete(lane);
				this.reRollBank.set(this.reRollBank() + 1);
			} else {
				newSet.add(lane);
				this.reRollBank.set(this.reRollBank() - 1);
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

					return `${laneLabel} - "${championName}"`;
				})
				.join('\n') +
			'\n' +
			this.reRollBank() +
			' rerolls remaining';

		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(draftText);
			} catch (error) {
				console.error('Failed to copy draft to clipboard:', error);
			}
		}
	}

	public resetBlacklist(): void {
		this.blacklistedChampions.set(new Set());
	}

	public setFearlessDraftEnabled(value: boolean): void {
		this.fearlessDraftEnabled.set(value);
		// Reset blacklist when disabling fearless draft
		if (!value) {
			this.resetBlacklist();
		}
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
}
