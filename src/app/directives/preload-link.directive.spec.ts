import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { PreloadLinkDirective } from './preload-link.directive';

@Component({
	selector: 'app-test-component',
	template: '<img [appPreloadLink]="imageUrl" />',
	imports: [PreloadLinkDirective],
})
class TestComponent {
	imageUrl = 'https://example.com/test.png';
}

describe('PreloadLinkDirective', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [PreloadLinkDirective, TestComponent],
			providers: [provideZonelessChangeDetection()],
		}).compileComponents();
	});

	it('should create an instance', () => {
		const fixture = TestBed.createComponent(TestComponent);
		fixture.detectChanges();
		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should add preload link to document head', (done) => {
		const fixture = TestBed.createComponent(TestComponent);
		fixture.detectChanges();

		// Wait for afterNextRender
		setTimeout(() => {
			const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]');
			const hasTestLink = Array.from(preloadLinks).some((link) =>
				link.getAttribute('href')?.includes('test.png')
			);
			expect(hasTestLink).toBe(true);
			done();
		}, 100);
	});

	it('should set fetchpriority to high', (done) => {
		const fixture = TestBed.createComponent(TestComponent);
		fixture.detectChanges();

		setTimeout(() => {
			const preloadLinks = document.querySelectorAll(
				'link[rel="preload"][as="image"][fetchpriority="high"]'
			);
			const hasTestLink = Array.from(preloadLinks).some((link) =>
				link.getAttribute('href')?.includes('test.png')
			);
			expect(hasTestLink).toBe(true);
			done();
		}, 100);
	});

	it('should not create duplicate preload links', (done) => {
		const fixture1 = TestBed.createComponent(TestComponent);
		const fixture2 = TestBed.createComponent(TestComponent);

		fixture1.detectChanges();
		fixture2.detectChanges();

		setTimeout(() => {
			const preloadLinks = document.querySelectorAll(
				'link[rel="preload"][href="https://example.com/test.png"]'
			);
			// Should only have one link, not duplicates
			expect(preloadLinks.length).toBeLessThanOrEqual(1);
			done();
		}, 100);
	});

	afterEach(() => {
		// Clean up preload links created during tests
		const preloadLinks = document.querySelectorAll('link[rel="preload"]');
		preloadLinks.forEach((link) => link.remove());
	});
});
