import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { BlacklistDialogComponent } from '../blacklist-dialog/blacklist-dialog.component';
import { MultiplayerDialogComponent } from '../multiplayer-dialog/multiplayer-dialog.component';
import { RandomizerStateService } from '../../services/randomizer-state.service';
import { LanguageService } from '../../services/language.service';
import { MultiplayerService } from '../../services/multiplayer.service';
import { TranslateModule } from '@ngx-translate/core';

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
	private readonly languageService = inject(LanguageService);
	protected readonly multiplayerService = inject(MultiplayerService);

	onRoll(): void {
		void this.state.rollAssignments();
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

	openBlacklist(): void {
		this.dialog.open(BlacklistDialogComponent);
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
				currentLang: this.languageService.currentLang(),
				setLang: (lang: string) => this.languageService.setLanguage(lang),
			},
		});
	}

	openMultiplayer(): void {
		const dialogRef = this.dialog.open(MultiplayerDialogComponent);
		dialogRef.afterClosed().subscribe((result) => {
			if (result?.success && result?.roomId) {
				console.log('Successfully joined/created room:', result.roomId);
			}
		});
	}

	leaveRoom(): void {
		void this.multiplayerService.leaveRoom();
	}
}
