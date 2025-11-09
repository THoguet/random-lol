import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LaneCardComponent } from './lane-card.component';
import { RandomizerStateService } from '../../services/randomizer-state.service';

describe('LaneCardComponent', () => {
	let component: LaneCardComponent;
	let fixture: ComponentFixture<LaneCardComponent>;
	let mockStateService: jasmine.SpyObj<RandomizerStateService>;

	beforeEach(async () => {
		mockStateService = jasmine.createSpyObj('RandomizerStateService', [
			'laneLabel',
			'roleLabel',
			'changeChampion',
			'toggleLane',
		]);

		await TestBed.configureTestingModule({
			imports: [LaneCardComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: RandomizerStateService, useValue: mockStateService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(LaneCardComponent);
		component = fixture.componentInstance;

		// Set required inputs
		fixture.componentRef.setInput('lane', 'top');

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('inputs', () => {
		it('should accept lane input', () => {
			fixture.componentRef.setInput('lane', 'mid');
			fixture.detectChanges();
			expect(component.lane()).toBe('mid');
		});
	});

	describe('actions', () => {
		it('should call changeChampion on service', () => {
			component.onChangeChampion(false);
			expect(mockStateService.changeChampion).toHaveBeenCalledWith('top', false);
		});

		it('should call changeChampion with forceReroll true', () => {
			component.onChangeChampion(true);
			expect(mockStateService.changeChampion).toHaveBeenCalledWith('top', true);
		});

		it('should call toggleLane on service', () => {
			component.onToggleDisableLane();
			expect(mockStateService.toggleLane).toHaveBeenCalledWith('top');
		});
	});

	describe('roleLabel', () => {
		it('should call roleLabel on service', () => {
			mockStateService.roleLabel.and.returnValue('Top Lane');
			expect(component.roleLabel('top')).toBe('Top Lane');
			expect(mockStateService.roleLabel).toHaveBeenCalledWith('top');
		});
	});
});
