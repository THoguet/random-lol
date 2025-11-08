import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ImagePreloadService } from './image-preload.service';
import { ChampionDataService } from './champion-data.service';

describe('ImagePreloadService', () => {
	let service: ImagePreloadService;
	let championDataService: jasmine.SpyObj<ChampionDataService>;

	beforeEach(() => {
		const championDataSpy = jasmine.createSpyObj('ChampionDataService', ['ensureLoaded'], {
			champions: jasmine.createSpy().and.returnValue([
				{
					id: 'Aatrox',
					name: 'Aatrox',
					roles: ['top'],
					icon: 'https://example.com/aatrox.png',
				},
				{
					id: 'Ahri',
					name: 'Ahri',
					roles: ['mid'],
					icon: 'https://example.com/ahri.png',
				},
			]),
		});

		championDataSpy.ensureLoaded.and.returnValue(Promise.resolve());

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				ImagePreloadService,
				{ provide: ChampionDataService, useValue: championDataSpy },
			],
		});

		championDataService = TestBed.inject(
			ChampionDataService,
		) as jasmine.SpyObj<ChampionDataService>;
		service = TestBed.inject(ImagePreloadService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('clearCache', () => {
		it('should clear the cache if caches API is available', async () => {
			if (!('caches' in window)) {
				pending('caches API not available in this environment');
				return;
			}

			spyOn(caches, 'delete').and.returnValue(Promise.resolve(true));

			await service.clearCache();

			expect(caches.delete).toHaveBeenCalledWith('lol-champion-images-v1');
		});

		it('should handle errors when clearing cache', async () => {
			if (!('caches' in window)) {
				pending('caches API not available in this environment');
				return;
			}

			spyOn(caches, 'delete').and.returnValue(Promise.reject(new Error('Cache error')));
			spyOn(console, 'warn');

			await service.clearCache();

			expect(console.warn).toHaveBeenCalled();
		});
	});
});
