import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ChampionDataService } from './champion-data.service';
import { CHAMPION_DATA_URL } from '../data/champions.data';

describe('ChampionDataService', () => {
	let service: ChampionDataService;
	let httpMock: HttpTestingController;

	const mockRemoteChampions = {
		Aatrox: {
			name: 'Aatrox',
			icon: 'http://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Aatrox.png',
			positions: ['TOP'],
		},
		Ahri: {
			name: 'Ahri',
			icon: 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Ahri.png',
			positions: ['MIDDLE'],
		},
		Jinx: {
			name: 'Jinx',
			icon: 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Jinx.png',
			positions: ['BOTTOM'],
		},
		Thresh: {
			name: 'Thresh',
			icon: 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Thresh.png',
			positions: ['SUPPORT'],
		},
		LeeSin: {
			name: 'Lee Sin',
			icon: 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/LeeSin.png',
			positions: ['JUNGLE', 'TOP'],
		},
		InvalidChampion: {
			name: 'Invalid',
			icon: '',
			positions: [],
		},
	};

	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				ChampionDataService,
			],
		});
		service = TestBed.inject(ChampionDataService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('ensureLoaded', () => {
		it('should load champions from API', async () => {
			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			expect(req.request.method).toBe('GET');
			req.flush(mockRemoteChampions);

			await loadPromise;

			const champions = service.champions();
			expect(champions.length).toBe(5); // Invalid champion is filtered out
			expect(champions[0].name).toBe('Aatrox');
		});

		it('should convert http to https URLs', async () => {
			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);

			await loadPromise;

			const champions = service.champions();
			const aatrox = champions.find((c) => c.name === 'Aatrox');
			expect(aatrox?.icon).toContain('https://');
		});

		it('should map positions to lanes correctly', async () => {
			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);

			await loadPromise;

			const champions = service.champions();
			const aatrox = champions.find((c) => c.name === 'Aatrox');
			const ahri = champions.find((c) => c.name === 'Ahri');
			const jinx = champions.find((c) => c.name === 'Jinx');
			const thresh = champions.find((c) => c.name === 'Thresh');
			const leeSin = champions.find((c) => c.name === 'Lee Sin');

			expect(aatrox?.roles).toEqual(['top']);
			expect(ahri?.roles).toEqual(['mid']);
			expect(jinx?.roles).toEqual(['adc']);
			expect(thresh?.roles).toEqual(['support']);
			expect(leeSin?.roles).toContain('jungle');
			expect(leeSin?.roles).toContain('top');
		});

		it('should organize champions by lane', async () => {
			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);

			await loadPromise;

			const byLane = service.championsByLane();
			expect(byLane.get('top')?.length).toBeGreaterThan(0);
			expect(byLane.get('jungle')?.length).toBeGreaterThan(0);
			expect(byLane.get('mid')?.length).toBeGreaterThan(0);
			expect(byLane.get('adc')?.length).toBeGreaterThan(0);
			expect(byLane.get('support')?.length).toBeGreaterThan(0);
		});

		it('should not reload if already loaded', async () => {
			const loadPromise = service.ensureLoaded();
			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);
			await loadPromise;

			// Second call should not make HTTP request
			await service.ensureLoaded();
			httpMock.expectNone(CHAMPION_DATA_URL);
		});

		it('should set loading state correctly', async () => {
			expect(service.loading()).toBe(false);

			const loadPromise = service.ensureLoaded();
			expect(service.loading()).toBe(true);

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);
			await loadPromise;

			expect(service.loading()).toBe(false);
		});

		it('should handle HTTP errors', async () => {
			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.error(new ProgressEvent('error'), { status: 500 });

			await loadPromise;

			expect(service.error()).toContain('Unable to load champion data');
			expect(service.champions().length).toBe(0);
		});

		it('should filter out champions without icon', async () => {
			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);

			await loadPromise;

			const champions = service.champions();
			const invalidChampion = champions.find((c) => c.name === 'Invalid');
			expect(invalidChampion).toBeUndefined();
		});

		it('should sort champions alphabetically', async () => {
			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);

			await loadPromise;

			const champions = service.champions();
			for (let i = 1; i < champions.length; i++) {
				expect(champions[i - 1].name.localeCompare(champions[i].name)).toBeLessThanOrEqual(
					0
				);
			}
		});
	});

	describe('reload', () => {
		it('should force reload even if already loaded', async () => {
			// Initial load
			const loadPromise = service.ensureLoaded();
			const req1 = httpMock.expectOne(CHAMPION_DATA_URL);
			req1.flush(mockRemoteChampions);
			await loadPromise;

			// Force reload
			const reloadPromise = service.reload();
			const req2 = httpMock.expectOne(CHAMPION_DATA_URL);
			req2.flush(mockRemoteChampions);
			await reloadPromise;

			expect(service.champions().length).toBeGreaterThan(0);
		});
	});

	describe('cache management', () => {
		it('should save champions to localStorage', async () => {
			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);
			await loadPromise;

			const cached = localStorage.getItem('lol-champions-cache');
			expect(cached).toBeTruthy();

			const parsedCache = JSON.parse(cached!);
			expect(parsedCache.version).toBe(1);
			expect(parsedCache.champions).toBeDefined();
			expect(parsedCache.timestamp).toBeDefined();
		});

		it('should load from cache if available and not expired', async () => {
			// Manually set cache
			const mockChampions = [
				{
					id: 'Aatrox',
					name: 'Aatrox',
					roles: ['top'],
					icon: 'https://example.com/aatrox.png',
				},
			];

			const cacheData = {
				version: 1,
				timestamp: Date.now(),
				champions: mockChampions,
			};

			localStorage.setItem('lol-champions-cache', JSON.stringify(cacheData));

			await service.ensureLoaded();

			// Should not make HTTP request
			httpMock.expectNone(CHAMPION_DATA_URL);
			expect(service.champions().length).toBe(1);
		});

		it('should invalidate expired cache', async () => {
			// Set expired cache
			const mockChampions = [
				{
					id: 'Aatrox',
					name: 'Aatrox',
					roles: ['top'],
					icon: 'https://example.com/aatrox.png',
				},
			];

			const cacheData = {
				version: 1,
				timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
				champions: mockChampions,
			};

			localStorage.setItem('lol-champions-cache', JSON.stringify(cacheData));

			const loadPromise = service.ensureLoaded();

			// Should make HTTP request due to expired cache
			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);
			await loadPromise;

			expect(service.champions().length).toBeGreaterThan(1);
		});

		it('should clear cache', () => {
			localStorage.setItem('lol-champions-cache', 'test');
			service.clearCache();
			expect(localStorage.getItem('lol-champions-cache')).toBeNull();
		});

		it('should handle invalid cache data gracefully', async () => {
			localStorage.setItem('lol-champions-cache', 'invalid json');

			const loadPromise = service.ensureLoaded();

			const req = httpMock.expectOne(CHAMPION_DATA_URL);
			req.flush(mockRemoteChampions);
			await loadPromise;

			expect(service.champions().length).toBeGreaterThan(0);
		});
	});
});
