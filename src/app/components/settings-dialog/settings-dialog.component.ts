import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export interface SettingsData {
	fearlessDraftEnabled: boolean;
}

// Data passed into the dialog: initial boolean and a setter callback
export interface SettingsDialogData {
	fearlessDraftEnabled: boolean;
	setFearless: (value: boolean) => void;
}

@Component({
	selector: 'app-settings-dialog',
	imports: [MatDialogModule, MatSlideToggleModule],
	templateUrl: './settings-dialog.component.html',
	styleUrl: './settings-dialog.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialogComponent {
	// Inject the dialog data which contains the current value and a setter callback.
	private data = inject(MAT_DIALOG_DATA) as SettingsDialogData;
	private dialogRef = inject(MatDialogRef<SettingsDialogComponent>);

	// Called when the toggle changes — immediately call the provided setter so
	// the parent receives the change right away (no Save/Cancel required).
	onToggle(checked: boolean): void {
		this.data.setFearless(checked);
		// update local copy so UI reflects the latest value
		this.data.fearlessDraftEnabled = checked;
	}

	// Small helper used by the template to read the current value.
	get fearlessDraftEnabled(): boolean {
		return this.data.fearlessDraftEnabled;
	}
}
