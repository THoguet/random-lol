import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MultiplayerService } from '../../services/multiplayer.service';

@Component({
	selector: 'app-multiplayer-dialog',
	imports: [
		FormsModule,
		MatButtonModule,
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
		MatTabsModule,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './multiplayer-dialog.component.html',
	styleUrl: './multiplayer-dialog.component.css',
})
export class MultiplayerDialogComponent {
	private readonly dialogRef = inject(MatDialogRef<MultiplayerDialogComponent>);
	private readonly multiplayerService = inject(MultiplayerService);

	protected readonly playerName = signal<string>('');
	protected readonly roomId = signal<string>('');
	protected readonly error = signal<string | null>(null);
	protected readonly isLoading = signal<boolean>(false);

	async onCreateRoom(): Promise<void> {
		const name = this.playerName().trim();
		if (!name) {
			this.error.set('Please enter your name');
			return;
		}

		this.isLoading.set(true);
		this.error.set(null);

		try {
			const response = await this.multiplayerService.createRoom(name);
			if (response.success && response.roomId) {
				this.dialogRef.close({ success: true, roomId: response.roomId });
			} else {
				this.error.set(response.error || 'Failed to create room');
			}
		} catch (err) {
			this.error.set('An error occurred while creating the room');
		} finally {
			this.isLoading.set(false);
		}
	}

	async onJoinRoom(): Promise<void> {
		const name = this.playerName().trim();
		const room = this.roomId().trim().toUpperCase();

		if (!name) {
			this.error.set('Please enter your name');
			return;
		}

		if (!room) {
			this.error.set('Please enter a room ID');
			return;
		}

		this.isLoading.set(true);
		this.error.set(null);

		try {
			const response = await this.multiplayerService.joinRoom(room, name);
			if (response.success) {
				this.dialogRef.close({ success: true, roomId: room });
			} else {
				this.error.set(response.error || 'Failed to join room');
			}
		} catch (err) {
			this.error.set('An error occurred while joining the room');
		} finally {
			this.isLoading.set(false);
		}
	}

	onCancel(): void {
		this.dialogRef.close({ success: false });
	}

	updatePlayerName(value: string): void {
		this.playerName.set(value);
		this.error.set(null);
	}

	updateRoomId(value: string): void {
		this.roomId.set(value);
		this.error.set(null);
	}
}
