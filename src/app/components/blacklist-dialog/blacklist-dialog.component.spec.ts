import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { BlacklistDialogComponent } from './blacklist-dialog.component';
import { RandomizerStateService } from '../../services/randomizer-state.service';
import { signal } from '@angular/core';

describe('BlacklistDialogComponent', () => {
	let component: BlacklistDialogComponent;
	let fixture: ComponentFixture<BlacklistDialogComponent>;
	let mockState: jasmine.SpyObj<RandomizerStateService>;

	beforeEach(async () => {
		mockState = jasmine.createSpyObj('RandomizerStateService', ['laneLabel'], {
			lanes: ['top', 'jungle', 'mid', 'adc', 'support'],
			blacklistedChampions: signal(new Set<string>(['Aatrox', 'Ahri'])),
			blacklistedChampionsByLane: signal(new Map()),
		});

		await TestBed.configureTestingModule({
			imports: [BlacklistDialogComponent, MatDialogModule, TranslateModule.forRoot()],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: RandomizerStateService, useValue: mockState },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(BlacklistDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should call laneLabel from state service', () => {
		mockState.laneLabel.and.returnValue('Top Lane');
		const result = component.laneLabel('top');
		expect(result).toBe('Top Lane');
		expect(mockState.laneLabel).toHaveBeenCalledWith('top');
	});
});
