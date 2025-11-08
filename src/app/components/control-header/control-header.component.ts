import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-control-header',
	imports: [MatButtonModule, MatIconModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './control-header.component.html',
	styleUrl: './control-header.component.css',
})
export class ControlHeaderComponent {
	isLoading = input<boolean>(false);
	hasChampions = input<boolean>(false);
	loadError = input<string | null>(null);
	canCopyDraft = input<boolean>(false);

	roll = output<void>();
	retry = output<void>();
	copyDraft = output<void>();

	onRoll(): void {
		this.roll.emit();
	}

	onRetry(): void {
		this.retry.emit();
	}

	onCopyDraft(): void {
		this.copyDraft.emit();
	}
}
