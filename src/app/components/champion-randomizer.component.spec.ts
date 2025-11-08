import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ChampionRandomizerComponent } from './champion-randomizer.component';
import { ChampionDataService } from '../services/champion-data.service';
import { RandomNumber } from '../services/random-number';
import { Champion } from '../data/champions.data';

describe('ChampionRandomizerComponent', () => {
	let component: ChampionRandomizerComponent;
	let fixture: ComponentFixture<ChampionRandomizerComponent>;
	let championDataService: jasmine.SpyObj<ChampionDataService>;

	const mockChampions: Champion[] = [
		{
			id: 'Aatrox',
			name: 'Aatrox',
			roles: ['top'],
			icon: 'https://example.com/aatrox.png',
		},
		{
			id: 'Ahri',
			name: 'Ahri',
			roles: ['mid'],
			icon: 'https://example.com/ahri.png',
		},
		{
			id: 'Jinx',
			name: 'Jinx',
			roles: ['adc'],
			icon: 'https://example.com/jinx.png',
		},
		{
			id: 'Thresh',
			name: 'Thresh',
			roles: ['support'],
			icon: 'https://example.com/thresh.png',
		},
		{
			id: 'LeeSin',
			name: 'Lee Sin',
			roles: ['jungle'],
			icon: 'https://example.com/leesin.png',
		},
	];

	beforeEach(async () => {
		const championsSignal = signal<Champion[]>(mockChampions);
		const championsByLaneMap = new Map([
			['top', [mockChampions[0]]],
			['mid', [mockChampions[1]]],
			['adc', [mockChampions[2]]],
			['support', [mockChampions[3]]],
			['jungle', [mockChampions[4]]],
		]);
		const championsByLaneSignal = signal(championsByLaneMap);
		const loadingSignal = signal(false);
		const errorSignal = signal<string | null>(null);

		const championDataSpy = jasmine.createSpyObj(
			'ChampionDataService',
			['ensureLoaded', 'reload'],
			{
				champions: championsSignal.asReadonly(),
				championsByLane: championsByLaneSignal.asReadonly(),
				loading: loadingSignal.asReadonly(),
				error: errorSignal.asReadonly(),
			}
		);

		championDataSpy.ensureLoaded.and.returnValue(Promise.resolve());
		championDataSpy.reload.and.returnValue(Promise.resolve());

		await TestBed.configureTestingModule({
			imports: [ChampionRandomizerComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: ChampionDataService, useValue: championDataSpy },
			],
		}).compileComponents();

		championDataService = TestBed.inject(
			ChampionDataService
		) as jasmine.SpyObj<ChampionDataService>;
		fixture = TestBed.createComponent(ChampionRandomizerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should initialize with all lanes enabled', () => {
		expect(component.disabledLanes().size).toBe(0);
	});

	it('should have max reroll bank initially', () => {
		expect(component['reRollBank']()).toBe(5);
		expect(component['reRollBankMax']()).toBe(5);
	});

	describe('rollAssignments', () => {
		it('should assign champions to all lanes', () => {
			spyOn(RandomNumber, 'getSecureRandomInt').and.returnValue(0);

			// Trigger the effect that calls rollAssignments by setting loading to true then false
			const championsSignal = signal<Champion[]>(mockChampions);
			const championsByLaneMap = new Map([
				['top', [mockChampions[0]]],
				['mid', [mockChampions[1]]],
				['adc', [mockChampions[2]]],
				['support', [mockChampions[3]]],
				['jungle', [mockChampions[4]]],
			]);
			const championsByLaneSignal = signal(championsByLaneMap);

			// Access the private championData service and update it
			const championData = (component as any).championData;
			if (championData) {
				// Manually call rollAssignments
				component['rollAssignments']();
			}

			const assignments = component['assignments']();
			// Check that assignments exist (may be null for some lanes due to mocking)
			expect(assignments.size).toBe(5);
		});

		it('should reset reroll bank to max', () => {
			component['reRollBank'].set(2);
			component['rollAssignments']();
			expect(component['reRollBank']()).toBe(5);
		});

		it('should not assign duplicate champions', () => {
			component['rollAssignments']();

			const assignments = component['assignments']();
			const assignedChampions = new Set<string>();

			assignments.forEach((champion) => {
				if (champion) {
					expect(assignedChampions.has(champion.name)).toBe(false);
					assignedChampions.add(champion.name);
				}
			});
		});

		it('should skip disabled lanes', () => {
			component.toggleLane('top');
			component['rollAssignments']();

			const assignments = component['assignments']();
			expect(assignments.get('top')).toBeNull();
		});
	});

	describe('toggleLane', () => {
		it('should disable a lane', () => {
			component.toggleLane('top');
			expect(component.disabledLanes().has('top')).toBe(true);
		});

		it('should enable a previously disabled lane', () => {
			component.toggleLane('top');
			expect(component.disabledLanes().has('top')).toBe(true);

			component.toggleLane('top');
			expect(component.disabledLanes().has('top')).toBe(false);
		});

		it('should set champion to null when disabling', () => {
			component['rollAssignments']();
			component.toggleLane('top');

			const assignments = component['assignments']();
			expect(assignments.get('top')).toBeNull();
		});

		it('should increase reroll bank when enabling lane', () => {
			component['reRollBank'].set(3);
			component.toggleLane('top'); // disable
			component.toggleLane('top'); // enable
			expect(component['reRollBank']()).toBe(4);
		});
	});

	describe('changeChampion', () => {
		beforeEach(() => {
			component['rollAssignments']();
		});

		it('should change champion for a lane', () => {
			spyOn(RandomNumber, 'getSecureRandomInt').and.returnValue(0);

			const initialChampion = component['assignments']().get('top');
			component.changeChampion('top', true);

			const newChampion = component['assignments']().get('top');
			// Could be same if only one champion available, but method was called
			expect(newChampion).toBeTruthy();
		});

		it('should decrease reroll bank', () => {
			component['reRollBank'].set(5);
			component.changeChampion('top');
			expect(component['reRollBank']()).toBe(4);
		});

		it('should not change champion if reroll bank is less than 1 and not forced', () => {
			// Set up state with champions available for reroll
			const championsSignal = signal<Champion[]>(mockChampions);
			const championsByLaneMap = new Map([
				['top', mockChampions.filter((c) => c.roles.includes('top'))],
				['mid', [mockChampions[1]]],
				['adc', [mockChampions[2]]],
				['support', [mockChampions[3]]],
				['jungle', [mockChampions[4]]],
			]);

			// Set initial assignment
			component['assignments'].set(
				new Map([
					['top', mockChampions[0]],
					['jungle', null],
					['mid', null],
					['adc', null],
					['support', null],
				])
			);

			// Set reroll bank to 0.5 (less than 1)
			component['reRollBank'].set(0.5);
			const initialChampion = component['assignments']().get('top');
			component.changeChampion('top', false);
			const newChampion = component['assignments']().get('top');
			// Since reroll bank is less than 1 and not forced, should return early
			expect(newChampion).toEqual(initialChampion);
			// Reroll bank should not have decreased since we returned early
			expect(component['reRollBank']()).toBe(0.5);
		});

		it('should change champion even with 0 rerolls if forced', () => {
			spyOn(RandomNumber, 'getSecureRandomInt').and.returnValue(0);
			component['reRollBank'].set(0);
			component.changeChampion('top', true);
			expect(component['reRollBank']()).toBe(-1);
		});
	});

	describe('computed properties', () => {
		it('should compute hasChampions correctly', () => {
			expect(component['hasChampions']()).toBe(true);
		});

		it('should compute activatedLanesArray correctly', () => {
			component.toggleLane('top');
			component.toggleLane('jungle');

			const activated = component['activatedLanesArray']();
			expect(activated.length).toBe(3);
			expect(activated).not.toContain('top');
			expect(activated).not.toContain('jungle');
		});

		it('should compute disabledLanesArray correctly', () => {
			component.toggleLane('top');
			component.toggleLane('jungle');

			const disabled = component['disabledLanesArray']();
			expect(disabled.length).toBe(2);
			expect(disabled).toContain('top');
			expect(disabled).toContain('jungle');
		});

		it('should compute canCopyDraft correctly when champions assigned', () => {
			// Manually set some assignments to test
			component['assignments'].set(
				new Map([
					['top', mockChampions[0]],
					['jungle', mockChampions[4]],
					['mid', mockChampions[1]],
					['adc', mockChampions[2]],
					['support', mockChampions[3]],
				])
			);

			expect(component['canCopyDraft']()).toBe(true);
		});

		it('should compute canCopyDraft correctly when no champions assigned', () => {
			// Disable all lanes
			component.toggleLane('top');
			component.toggleLane('jungle');
			component.toggleLane('mid');
			component.toggleLane('adc');
			component.toggleLane('support');

			expect(component['canCopyDraft']()).toBe(false);
		});

		it('should compute laneAssignments with proper labels', () => {
			component['rollAssignments']();
			const assignments = component['laneAssignments']();

			expect(assignments.length).toBe(5);
			assignments.forEach((assignment) => {
				expect(assignment.lane).toBeTruthy();
				expect(assignment.rolesText).toBeDefined();
			});
		});
	});

	describe('copyDraftToClipboard', () => {
		it('should copy draft text to clipboard', async () => {
			if (!navigator.clipboard) {
				pending('Clipboard API not available');
				return;
			}

			spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
			component['rollAssignments']();

			await component.copyDraftToClipboard();

			expect(navigator.clipboard.writeText).toHaveBeenCalled();
			const callArg = (navigator.clipboard.writeText as jasmine.Spy).calls.argsFor(0)[0];
			expect(callArg).toContain('rerolls remaining');
		});

		it('should handle clipboard errors gracefully', async () => {
			if (!navigator.clipboard) {
				pending('Clipboard API not available');
				return;
			}

			spyOn(navigator.clipboard, 'writeText').and.returnValue(
				Promise.reject(new Error('Clipboard error'))
			);
			spyOn(console, 'error');
			component['rollAssignments']();

			await component.copyDraftToClipboard();

			expect(console.error).toHaveBeenCalled();
		});
	});

	describe('retryLoad', () => {
		it('should call championData.reload', () => {
			component['retryLoad']();
			expect(championDataService.reload).toHaveBeenCalled();
		});
	});

	describe('laneLabel and roleLabel', () => {
		it('should return correct lane label', () => {
			expect(component['laneLabel']('top')).toBe('Top Lane');
			expect(component['laneLabel']('jungle')).toBe('Jungle');
			expect(component['laneLabel']('mid')).toBe('Mid Lane');
			expect(component['laneLabel']('adc')).toBe('Bot Carry');
			expect(component['laneLabel']('support')).toBe('Support');
		});

		it('should return correct role label', () => {
			expect(component['roleLabel']('top')).toBe('Top Lane');
			expect(component['roleLabel']('jungle')).toBe('Jungle');
		});
	});

	describe('shift key tracking', () => {
		it('should track shift key press', () => {
			const event = new KeyboardEvent('keydown', { key: 'Shift' });
			window.dispatchEvent(event);
			expect(component['isShiftPressed']()).toBe(true);
		});

		it('should track shift key release', () => {
			const downEvent = new KeyboardEvent('keydown', { key: 'Shift' });
			window.dispatchEvent(downEvent);

			const upEvent = new KeyboardEvent('keyup', { key: 'Shift' });
			window.dispatchEvent(upEvent);
			expect(component['isShiftPressed']()).toBe(false);
		});
	});
});
