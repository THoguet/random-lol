import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { imageCacheInterceptor } from './image-cache.interceptor';

describe('imageCacheInterceptor', () => {
	let httpMock: HttpTestingController;
	let httpClient: HttpClient;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(withInterceptors([imageCacheInterceptor])),
				provideHttpClientTesting(),
			],
		});

		httpMock = TestBed.inject(HttpTestingController);
		httpClient = TestBed.inject(HttpClient);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should add cache headers for png images', () => {
		httpClient.get('https://example.com/image.png').subscribe();

		const req = httpMock.expectOne('https://example.com/image.png');
		expect(req.request.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
		req.flush({});
	});

	it('should add cache headers for jpg images', () => {
		httpClient.get('https://example.com/image.jpg').subscribe();

		const req = httpMock.expectOne('https://example.com/image.jpg');
		expect(req.request.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
		req.flush({});
	});

	it('should add cache headers for jpeg images', () => {
		httpClient.get('https://example.com/image.jpeg').subscribe();

		const req = httpMock.expectOne('https://example.com/image.jpeg');
		expect(req.request.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
		req.flush({});
	});

	it('should add cache headers for webp images', () => {
		httpClient.get('https://example.com/image.webp').subscribe();

		const req = httpMock.expectOne('https://example.com/image.webp');
		expect(req.request.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
		req.flush({});
	});

	it('should add cache headers for gif images', () => {
		httpClient.get('https://example.com/image.gif').subscribe();

		const req = httpMock.expectOne('https://example.com/image.gif');
		expect(req.request.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
		req.flush({});
	});

	it('should add cache headers for champion URLs', () => {
		httpClient.get('https://example.com/champion/Aatrox').subscribe();

		const req = httpMock.expectOne('https://example.com/champion/Aatrox');
		expect(req.request.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
		req.flush({});
	});

	it('should add cache headers for ddragon URLs', () => {
		httpClient
			.get('https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Aatrox.png')
			.subscribe();

		const req = httpMock.expectOne(
			'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Aatrox.png'
		);
		expect(req.request.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
		req.flush({});
	});

	it('should not add cache headers for non-image requests', () => {
		httpClient.get('https://example.com/api/data').subscribe();

		const req = httpMock.expectOne('https://example.com/api/data');
		expect(req.request.headers.get('Cache-Control')).toBeNull();
		req.flush({});
	});

	it('should not add cache headers for JSON requests', () => {
		httpClient.get('https://example.com/data.json').subscribe();

		const req = httpMock.expectOne('https://example.com/data.json');
		expect(req.request.headers.get('Cache-Control')).toBeNull();
		req.flush({});
	});

	it('should not modify other request headers', () => {
		httpClient
			.get('https://example.com/image.png', {
				headers: { 'X-Custom-Header': 'test' },
			})
			.subscribe();

		const req = httpMock.expectOne('https://example.com/image.png');
		expect(req.request.headers.get('X-Custom-Header')).toBe('test');
		expect(req.request.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
		req.flush({});
	});
});
