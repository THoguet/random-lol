import { Directive, inject, input, afterNextRender } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Directive to add preload link tags for images in the document head.
 * This helps the browser discover and start loading images earlier.
 */
@Directive({
	selector: '[appPreloadLink]',
	standalone: true,
})
export class PreloadLinkDirective {
	private readonly document = inject(DOCUMENT);

	readonly src = input.required<string>({ alias: 'appPreloadLink' });

	constructor() {
		afterNextRender(() => {
			this.addPreloadLink();
		});
	}

	private addPreloadLink(): void {
		const url = this.src();
		if (!url) {
			return;
		}

		// Check if preload link already exists
		const existing = this.document.head.querySelector(`link[rel="preload"][href="${url}"]`);
		if (existing) {
			return;
		}

		// Create and append preload link
		const link = this.document.createElement('link');
		link.rel = 'preload';
		link.as = 'image';
		link.href = url;

		// Add fetchpriority for high priority images
		if (this.isHighPriority(url)) {
			link.setAttribute('fetchpriority', 'high');
		}

		this.document.head.appendChild(link);
	}

	private isHighPriority(_url: string): boolean {
		// You can customize this logic based on your needs
		// Parameter is intentionally unused for now; keep underscore to satisfy lint rules
		return true;
	}
}
