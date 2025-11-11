import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface SettingsData {
	fearlessDraftEnabled: boolean;
}

// Data passed into the dialog: initial boolean and a setter callback
export interface SettingsDialogData {
	fearlessDraftEnabled: boolean;
	setFearless: (value: boolean) => void;
	// currentLang is the current active language (e.g. 'en' or 'fr')
	currentLang?: string;
	// setLang callback to change the language at runtime
	setLang?: (lang: string) => void;
}

@Component({
	selector: 'app-settings-dialog',
	imports: [
		MatDialogModule,
		MatSlideToggleModule,
		MatFormFieldModule,
		MatSelectModule,
		TranslateModule,
	],
	templateUrl: './settings-dialog.component.html',
	styleUrl: './settings-dialog.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialogComponent {
	// Inject the dialog data which contains the current value and a setter callback.
	private data = inject(MAT_DIALOG_DATA) as SettingsDialogData;
	private dialogRef = inject(MatDialogRef<SettingsDialogComponent>);
	private translate = inject(TranslateService);

	// Supported languages; keep in sync with assets/i18n
	protected readonly languages = ['en', 'fr', 'zh'];

	// Called when the toggle changes — immediately call the provided setter so
	// the parent receives the change right away (no Save/Cancel required).
	onToggle(checked: boolean): void {
		this.data.setFearless(checked);
		// update local copy so UI reflects the latest value
		this.data.fearlessDraftEnabled = checked;
	}

	onLangChange(lang: string): void {
		// Call the parent-provided setter
		if (this.data.setLang) {
			this.data.setLang(lang);
		}
		// update local copy
		this.data.currentLang = lang;
	}

	// Small helper used by the template to read the current value.
	get fearlessDraftEnabled(): boolean {
		return this.data.fearlessDraftEnabled;
	}

	get currentLang(): string {
		return (
			this.data.currentLang ||
			this.translate.currentLang ||
			this.translate.getDefaultLang() ||
			'en'
		);
	}
}
