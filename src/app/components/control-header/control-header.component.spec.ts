import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ControlHeaderComponent } from './control-header.component';
import { RandomizerStateService } from '../../services/randomizer-state.service';

describe('ControlHeaderComponent', () => {
	let component: ControlHeaderComponent;
	let fixture: ComponentFixture<ControlHeaderComponent>;
	let mockDialog: jasmine.SpyObj<MatDialog>;
	let mockStateService: jasmine.SpyObj<RandomizerStateService>;

	beforeEach(async () => {
		mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
		mockStateService = jasmine.createSpyObj('RandomizerStateService', [
			'rollAssignments',
			'retryLoad',
			'copyDraftToClipboard',
			'resetBlacklist',
			'setFearlessDraftEnabled',
		]);

		// Provide minimal signal-like properties the template will call as functions
		Object.assign(mockStateService, {
			isLoading: () => false,
			hasChampions: () => true,
			canCopyDraft: () => false,
			rerollPercentage: () => 0,
			reRollBank: () => 0,
			fearlessDraftEnabled: () => true,
			loadError: () => null,
		});

		await TestBed.configureTestingModule({
			imports: [ControlHeaderComponent],
			providers: [
				provideZonelessChangeDetection(),
				{ provide: MatDialog, useValue: mockDialog },
				{ provide: RandomizerStateService, useValue: mockStateService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ControlHeaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('actions', () => {
		it('should call rollAssignments on roll', () => {
			component.onRoll();
			expect(mockStateService.rollAssignments).toHaveBeenCalled();
		});

		it('should call retryLoad on retry', () => {
			component.onRetry();
			expect(mockStateService.retryLoad).toHaveBeenCalled();
		});

		it('should call copyDraftToClipboard on copy draft', () => {
			component.onCopyDraft();
			expect(mockStateService.copyDraftToClipboard).toHaveBeenCalled();
		});

		it('should call resetBlacklist on reset', () => {
			component.onReset();
			expect(mockStateService.resetBlacklist).toHaveBeenCalled();
		});
	});

	describe('settings dialog', () => {
		it('should open settings dialog', () => {
			component.openSettings();
			expect(mockDialog.open).toHaveBeenCalled();
		});
	});
});
