import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { SettingsDialogComponent, SettingsDialogData } from './settings-dialog.component';

describe('SettingsDialogComponent', () => {
	let component: SettingsDialogComponent;
	let fixture: ComponentFixture<SettingsDialogComponent>;
	let mockDialogRef: jasmine.SpyObj<MatDialogRef<SettingsDialogComponent>>;
	let mockSetFearless: jasmine.Spy;

	beforeEach(async () => {
		mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
		mockSetFearless = jasmine.createSpy('setFearless');

		const mockDialogData: SettingsDialogData = {
			fearlessDraftEnabled: true,
			setFearless: mockSetFearless,
		};

		await TestBed.configureTestingModule({
			imports: [SettingsDialogComponent, TranslateModule.forRoot()],
			providers: [
				// Tests run without Zone.js by default in this repo. Provide zoneless
				// change detection so Angular doesn't try to create a Zone.
				provideZonelessChangeDetection(),
				{ provide: MatDialogRef, useValue: mockDialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: mockDialogData },
			],
		}).compileComponents();
		fixture = TestBed.createComponent(SettingsDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should have initial fearlessDraftEnabled value from dialog data', () => {
		expect(component.fearlessDraftEnabled).toBe(true);
	});

	it('should call setFearless callback when toggle changes', () => {
		component.onToggle(false);
		expect(mockSetFearless).toHaveBeenCalledWith(false);
	});

	it('should update local value when toggle changes', () => {
		component.onToggle(false);
		expect(component.fearlessDraftEnabled).toBe(false);
	});
});
