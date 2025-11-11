import { computed, effect, inject, Injectable, Injector, signal } from '@angular/core';
import { Champion, Lane, LANES } from '../data/champions.data';
import { ChampionDataService } from './champion-data.service';
import { RandomNumber } from './random-number';
import { storedMapSignal, storedSetSignal, storedSignal } from '../shared/utils/stored-signal';
import { MultiplayerService } from './multiplayer.service';

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
	private readonly injector = inject(Injector);
	private readonly multiplayerService = inject(MultiplayerService);
	private readonly laneTitleMap: Record<Lane, string> = {
		top: 'Top Lane',
		jungle: 'Jungle',
		mid: 'Mid Lane',
		adc: 'Bot Carry',
		support: 'Support',
	};

	private previousChampionStamp = storedSignal<string>(
		'randomizer.previousChampionStamp',
		'',
		this.injector,
	);

	// Core state signals
	public readonly disabledLanes = storedSetSignal<Lane>(
		'randomizer.disabledLanes',
		new Set(),
		this.injector,
	);
	public readonly reRollBank = storedSignal<number>('randomizer.reRollBank', 0, this.injector);
	public readonly reRollBankMax = storedSignal<number>(
		'randomizer.reRollBankMax',
		0,
		this.injector,
	);

	// Persisted settings using storedSignal
	public readonly blacklistedChampions = storedSignal<string[]>(
		'randomizer.blacklistedChampions',
		[],
		this.injector,
	);
	public readonly fearlessDraftEnabled = storedSignal<boolean>(
		'randomizer.fearlessDraftEnabled',
		true,
		this.injector,
	);
	public readonly assignments = storedMapSignal<Lane, Champion | null>(
		'randomizer.assignments',
		this.createEmptyAssignments(),
		this.injector,
	);

	public readonly isShiftPressed = signal<boolean>(false);
	public readonly showAndy = signal<boolean>(false);

	// Multiplayer mode
	public readonly isMultiplayerMode = computed(() => this.multiplayerService.isMultiplayerMode());
	public readonly currentRoomId = computed(() => this.multiplayerService.currentRoomId());
	public readonly roomPlayers = computed(() => this.multiplayerService.roomState()?.players || []);

	// Computed values from champion data service
	public readonly lanes = LANES;
	public readonly champions = computed(() => this.championData.champions());
	public readonly championsByLane = computed(() => this.championData.championsByLane());
	public readonly isLoading = computed(() => this.championData.loading());
	public readonly loadError = computed(() => this.championData.error());
	public readonly hasChampions = computed(() => this.champions().length > 0);

	// Computed derived state - use multiplayer state if in multiplayer mode
	public readonly disabledLanesArray = computed(() => {
		if (this.isMultiplayerMode()) {
			return this.multiplayerService.roomState()?.disabledLanes || [];
		}
		return Array.from(this.disabledLanes());
	});

	public readonly activatedLanesArray = computed(() => {
		const disabled = this.isMultiplayerMode()
			? new Set(this.multiplayerService.roomState()?.disabledLanes || [])
			: this.disabledLanes();
		return this.lanes.filter((lane) => !disabled.has(lane));
	});

	public readonly assignmentsArray = computed(() => {
		if (this.isMultiplayerMode()) {
			const roomState = this.multiplayerService.roomState();
			if (roomState) {
				const result: (Champion | null)[] = [];
				for (const lane of this.lanes) {
					result.push(roomState.assignments[lane] || null);
				}
				return result;
			}
		}
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
							) && !blacklisted.includes(champion.name),
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
					?.filter((champion) => blacklisted.includes(champion.name)) || [];
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
		const bank = this.isMultiplayerMode()
			? this.multiplayerService.roomState()?.reRollBank || 0
			: this.reRollBank();
		const max = this.isMultiplayerMode()
			? this.multiplayerService.roomState()?.reRollBankMax || 0
			: this.reRollBankMax();
		if (max === 0) {
			return 0;
		}
		return (bank / max) * 100;
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
				this.previousChampionStamp.set('');
				return;
			}

			const stamp = champions.map((champion) => champion.id).join('|');
			if (stamp !== this.previousChampionStamp()) {
				this.previousChampionStamp.set(stamp);
				this.rollAssignments();
			}

			if (this.assignments().size === 0) {
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

	private updateBlacklist() {
		// Add selected champions to blacklist for fearless draft (if enabled)
		if (this.fearlessDraftEnabled()) {
			this.blacklistedChampions.update((current) => {
				const updated = [...current];
				this.assignmentsArray().forEach((championName) => {
					if (championName === null) return;
					if (!updated.includes(championName.name)) {
						updated.push(championName.name);
					}
				});
				return updated;
			});
		}
	}

	// Actions
	public async rollAssignments(): Promise<void> {
		if (this.isMultiplayerMode()) {
			await this.multiplayerService.rollAllAssignments();
			return;
		}

		this.updateBlacklist();
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

	public async changeChampion(lane: Lane, forceReroll = false): Promise<void> {
		if (this.isMultiplayerMode()) {
			await this.multiplayerService.rerollLane(lane);
			return;
		}

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

		this.assignments.update((current) => {
			const newState = new Map(current);
			newState.set(lane, champion);
			return newState;
		});
	}

	public async toggleLane(lane: Lane): Promise<void> {
		if (this.isMultiplayerMode()) {
			await this.multiplayerService.toggleLane(lane);
			return;
		}

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
		this.blacklistedChampions.set([]);
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
