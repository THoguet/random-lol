import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { ImagePreloadService } from './services/image-preload.service';

describe('App', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [App],
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				ImagePreloadService,
			],
		}).compileComponents();
	});

	it('should create the app', () => {
		const fixture = TestBed.createComponent(App);
		const app = fixture.componentInstance;
		expect(app).toBeTruthy();
	});

	it('should inject ImagePreloadService', () => {
		const fixture = TestBed.createComponent(App);
		fixture.detectChanges();
		const service = TestBed.inject(ImagePreloadService);
		expect(service).toBeTruthy();
	});

	it('should render the app-champion-randomizer component', () => {
		const fixture = TestBed.createComponent(App);
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector('app-champion-randomizer')).toBeTruthy();
	});

	it('should render the toolbar', () => {
		const fixture = TestBed.createComponent(App);
		fixture.detectChanges();
		const compiled = fixture.nativeElement as HTMLElement;
		expect(compiled.querySelector('mat-toolbar')).toBeTruthy();
	});
});
