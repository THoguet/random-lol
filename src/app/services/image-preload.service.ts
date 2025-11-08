import { Injectable, inject, afterNextRender } from '@angular/core';
import { ChampionDataService } from './champion-data.service';

const IMAGE_CACHE_NAME = 'lol-champion-images-v1';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable({ providedIn: 'root' })
export class ImagePreloadService {
	private readonly championData = inject(ChampionDataService);
	private preloadedImages = new Set<string>();
	private cachePromise: Promise<Cache | null> | null = null;

	constructor() {
		afterNextRender(() => {
			this.initCache();
			// Start preloading immediately without waiting for idle
			this.schedulePreload();
		});
	}

	private async initCache(): Promise<void> {
		if (!('caches' in window)) {
			return;
		}

		this.cachePromise = caches.open(IMAGE_CACHE_NAME);

		// Clean up old cached images
		try {
			const cache = await this.cachePromise;
			if (!cache) return;

			const requests = await cache.keys();
			const now = Date.now();

			for (const request of requests) {
				const response = await cache.match(request);
				if (!response) continue;

				const cachedDate = response.headers.get('x-cached-date');
				if (cachedDate) {
					const cacheAge = now - parseInt(cachedDate, 10);
					if (cacheAge > CACHE_EXPIRY_MS) {
						await cache.delete(request);
					}
				}
			}
		} catch (error) {
			console.warn('Failed to clean up old cache:', error);
		}
	}

	private schedulePreload(): void {
		// Start preloading immediately to cache images before they're requested by components
		// This fixes the issue where caching doesn't work on first page load
		this.preloadImages();
	}

	private async preloadImages(): Promise<void> {
		await this.championData.ensureLoaded();

		const champions = this.championData.champions();
		const imagesToPreload = champions
			.map((champion) => champion.icon)
			.filter((icon) => !this.preloadedImages.has(icon));

		if (imagesToPreload.length === 0) {
			return;
		}

		console.log(`Preloading ${imagesToPreload.length} champion images...`);

		// Preload first batch with high priority (likely to be displayed first)
		// Use smaller batch size and no delay for first batch to ensure images
		// are available when components render
		const firstBatchSize = 20;
		const firstBatch = imagesToPreload.slice(0, firstBatchSize);
		const remainingImages = imagesToPreload.slice(firstBatchSize);

		// Preload first batch immediately with high priority
		await Promise.allSettled(firstBatch.map((url) => this.preloadAndCacheImage(url)));

		// Preload remaining images in batches to avoid overwhelming the network
		const batchSize = 10;
		for (let i = 0; i < remainingImages.length; i += batchSize) {
			const batch = remainingImages.slice(i, i + batchSize);
			await Promise.allSettled(batch.map((url) => this.preloadAndCacheImage(url)));

			// Small delay between batches to keep the browser responsive
			if (i + batchSize < remainingImages.length) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		console.log('Champion images preloaded and cached successfully');
	}

	private async preloadAndCacheImage(url: string): Promise<void> {
		if (this.preloadedImages.has(url)) {
			return;
		}

		try {
			// Check if already cached
			if (await this.isImageCached(url)) {
				this.preloadedImages.add(url);
				return;
			}

			// Fetch and cache the image
			const response = await fetch(url, {
				mode: 'cors',
				cache: 'force-cache',
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.status}`);
			}

			// Cache the response
			await this.cacheImage(url, response.clone());

			// Also preload in the browser's image cache
			await this.preloadImageInBrowser(url);

			this.preloadedImages.add(url);
		} catch (error) {
			console.warn(`Failed to preload and cache image: ${url}`, error);
		}
	}

	private async isImageCached(url: string): Promise<boolean> {
		if (!this.cachePromise) {
			return false;
		}

		try {
			const cache = await this.cachePromise;
			if (!cache) return false;

			const response = await cache.match(url);
			return response !== undefined;
		} catch {
			return false;
		}
	}

	private async cacheImage(url: string, response: Response): Promise<void> {
		if (!this.cachePromise) {
			return;
		}

		try {
			const cache = await this.cachePromise;
			if (!cache) return;

			// Check again if the entry exists to avoid race conditions
			const existingResponse = await cache.match(url);
			if (existingResponse) {
				return; // Already cached, skip
			}

			// Create a new response with cache metadata
			const blob = await response.blob();
			const cachedResponse = new Response(blob, {
				status: response.status,
				statusText: response.statusText,
				headers: {
					...Object.fromEntries(response.headers.entries()),
					'x-cached-date': Date.now().toString(),
				},
			});

			await cache.put(url, cachedResponse);
		} catch (error) {
			// Ignore "already exists" errors (race condition)
			if (error instanceof DOMException && error.name === 'InvalidAccessError') {
				return;
			}
			console.warn('Failed to cache image:', error);
		}
	}

	private preloadImageInBrowser(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve();
			img.onerror = () => reject(new Error(`Failed to load: ${url}`));
			img.src = url;
		});
	}

	/**
	 * Clear all cached images
	 */
	async clearCache(): Promise<void> {
		if (!('caches' in window)) {
			return;
		}

		try {
			await caches.delete(IMAGE_CACHE_NAME);
			this.preloadedImages.clear();
			console.log('Image cache cleared');
		} catch (error) {
			console.warn('Failed to clear image cache:', error);
		}
	}
}
