import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Champion, Lane, CHAMPION_DATA_URL, LANES } from './champions.data';

type RemotePosition = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'SUPPORT';

interface RemoteChampion {
	readonly name: string;
	readonly icon: string;
	readonly positions: ReadonlyArray<RemotePosition>;
}

const POSITION_TO_LANE: Record<RemotePosition, Lane> = {
	TOP: 'top',
	JUNGLE: 'jungle',
	MIDDLE: 'mid',
	BOTTOM: 'adc',
	SUPPORT: 'support',
};

const CACHE_KEY = 'lol-champions-cache';
const CACHE_VERSION = 1;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
	version: number;
	timestamp: number;
	champions: Champion[];
}

@Injectable({ providedIn: 'root' })
export class ChampionDataService {
	private readonly http = inject(HttpClient);

	private readonly championsSignal = signal<Champion[]>([]);
	private readonly championsByLaneSignal = signal<Map<Lane, Champion[]>>(new Map());
	private readonly loadingSignal = signal(false);
	private readonly errorSignal = signal<string | null>(null);

	readonly champions = this.championsSignal.asReadonly();
	readonly championsByLane = this.championsByLaneSignal.asReadonly();
	readonly loading = this.loadingSignal.asReadonly();
	readonly error = this.errorSignal.asReadonly();

	async ensureLoaded(force = false): Promise<void> {
		if (this.loadingSignal()) {
			return;
		}

		if (!force && this.championsSignal().length > 0) {
			return;
		}

		// Try to load from cache first
		if (!force && this.loadFromCache()) {
			return;
		}

		await this.loadChampions();
	}

	async reload(): Promise<void> {
		await this.ensureLoaded(true);
	}

	clearCache(): void {
		if (typeof localStorage === 'undefined') {
			return;
		}

		try {
			localStorage.removeItem(CACHE_KEY);
		} catch (error) {
			console.warn('Unable to clear cache', error);
		}
	}

	private loadFromCache(): boolean {
		if (typeof localStorage === 'undefined') {
			return false;
		}

		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (!cached) {
				return false;
			}

			const data: CachedData = JSON.parse(cached);

			// Validate cache
			if (
				data.version !== CACHE_VERSION ||
				Date.now() - data.timestamp > CACHE_EXPIRY_MS ||
				!Array.isArray(data.champions) ||
				data.champions.length === 0
			) {
				this.clearCache();
				return false;
			}

			this.championsSignal.set(data.champions);
			this.updateChampionsByLane(data.champions);
			return true;
		} catch (error) {
			console.warn('Unable to load from cache', error);
			this.clearCache();
			return false;
		}
	}

	private saveToCache(champions: Champion[]): void {
		if (typeof localStorage === 'undefined') {
			return;
		}

		try {
			const data: CachedData = {
				version: CACHE_VERSION,
				timestamp: Date.now(),
				champions,
			};
			localStorage.setItem(CACHE_KEY, JSON.stringify(data));
		} catch (error) {
			console.warn('Unable to save to cache', error);
		}
	}

	private async loadChampions(): Promise<void> {
		this.loadingSignal.set(true);
		this.errorSignal.set(null);

		try {
			const response = await firstValueFrom(
				this.http.get<Record<string, RemoteChampion>>(CHAMPION_DATA_URL),
			);

			const champions = Object.entries(response)
				.map(([id, data]) => this.toChampion(id, data))
				.filter((champion): champion is Champion => champion !== null)
				.sort((a, b) => a.name.localeCompare(b.name));

			this.championsSignal.set(champions);
			this.updateChampionsByLane(champions);
			this.saveToCache(champions);
		} catch (error) {
			console.error('Unable to load champion data', error);
			this.errorSignal.set('Unable to load champion data right now. Please try again.');
		} finally {
			this.loadingSignal.set(false);
		}
	}

	private updateChampionsByLane(champions: Champion[]): void {
		const map = new Map<Lane, Champion[]>();

		for (const lane of LANES) {
			map.set(lane, []);
		}

		for (const champion of champions) {
			for (const role of champion.roles) {
				map.get(role)!.push(champion);
			}
		}

		this.championsByLaneSignal.set(map);
	}

	private toChampion(id: string, data: RemoteChampion): Champion | null {
		const roles = Array.from(
			new Set(
				data.positions
					.map((position) => POSITION_TO_LANE[position])
					.filter((role): role is Lane => role !== undefined),
			),
		);

		if (roles.length === 0 || !data.icon) {
			return null;
		}

		return {
			id,
			name: data.name,
			roles,
			icon: this.ensureHttps(data.icon),
		};
	}

	private ensureHttps(url: string): string {
		return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url;
	}
}
