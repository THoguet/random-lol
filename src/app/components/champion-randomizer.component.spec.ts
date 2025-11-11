import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ChampionRandomizerComponent } from './champion-randomizer.component';
import { RandomizerStateService } from '../services/randomizer-state.service';

describe('ChampionRandomizerComponent', () => {
	let component: ChampionRandomizerComponent;
	let fixture: ComponentFixture<ChampionRandomizerComponent>;
	let mockStateService: jasmine.SpyObj<RandomizerStateService>;

	beforeEach(async () => {
		mockStateService = jasmine.createSpyObj('RandomizerStateService', [
			'rollAssignments',
			'retryLoad',
			'copyDraftToClipboard',
			'resetBlacklist',
			'changeChampion',
			'toggleLane',
			'laneLabel',
			'roleLabel',
			'setFearlessDraftEnabled',
		]);

		// Minimal signal-like stubs used by the component template/computeds
		Object.assign(mockStateService, {
			isLoading: () => false,
			hasChampions: () => true,
			canCopyDraft: () => false,
			loadError: () => null,
			showAndy: () => false,
			disabledLanes: () => new Set(),
			assignments: () => new Map(),
			laneAssignments: () => [],
			fearlessDraftEnabled: () => true,
			reRollBank: () => 0,
			rerollPercentage: () => 0,
		});

		await TestBed.configureTestingModule({
			imports: [ChampionRandomizerComponent, TranslateModule.forRoot()],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: RandomizerStateService, useValue: mockStateService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ChampionRandomizerComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have access to state service', () => {
		expect(component['state']).toBe(mockStateService);
	});
});
