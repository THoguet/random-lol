import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { RandomizerStateService } from '../../services/randomizer-state.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-control-header',
	imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './control-header.component.html',
	styleUrl: './control-header.component.css',
})
export class ControlHeaderComponent {
	private readonly dialog = inject(MatDialog);
	protected readonly state = inject(RandomizerStateService);
	private readonly translate = inject(TranslateService);

	// Expose current language for UI or binding
	get currentLang(): string {
		return this.translate.currentLang || this.translate.getDefaultLang() || 'en';
	}

	setLang(lang: string): void {
		this.translate.use(lang);
		try {
			localStorage.setItem('lang', lang);
		} catch {}
	}

	onRoll(): void {
		this.state.rollAssignments();
	}

	onRetry(): void {
		this.state.retryLoad();
	}

	onCopyDraft(): void {
		void this.state.copyDraftToClipboard();
	}

	onReset(): void {
		this.state.resetBlacklist();
	}

	openSettings(): void {
		// Open the settings dialog and pass an immediate setter callback so
		// the dialog can update the setting live (no Save/Cancel required).
		this.dialog.open(SettingsDialogComponent, {
			data: {
				fearlessDraftEnabled: this.state.fearlessDraftEnabled(),
				setFearless: (value: boolean) => {
					// Update the service state immediately
					this.state.setFearlessDraftEnabled(value);
				},
				currentLang: this.currentLang,
				setLang: (lang: string) => this.setLang(lang),
			},
		});
	}
}
