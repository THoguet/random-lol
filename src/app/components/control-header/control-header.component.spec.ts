import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ControlHeaderComponent } from './control-header.component';

describe('ControlHeaderComponent', () => {
	let component: ControlHeaderComponent;
	let fixture: ComponentFixture<ControlHeaderComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ControlHeaderComponent],
			providers: [provideZonelessChangeDetection()],
		}).compileComponents();

		fixture = TestBed.createComponent(ControlHeaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('inputs', () => {
		it('should accept isLoading input', () => {
			fixture.componentRef.setInput('isLoading', true);
			fixture.detectChanges();
			expect(component.isLoading()).toBe(true);
		});

		it('should accept hasChampions input', () => {
			fixture.componentRef.setInput('hasChampions', true);
			fixture.detectChanges();
			expect(component.hasChampions()).toBe(true);
		});

		it('should accept loadError input', () => {
			const error = 'Test error';
			fixture.componentRef.setInput('loadError', error);
			fixture.detectChanges();
			expect(component.loadError()).toBe(error);
		});

		it('should accept canCopyDraft input', () => {
			fixture.componentRef.setInput('canCopyDraft', true);
			fixture.detectChanges();
			expect(component.canCopyDraft()).toBe(true);
		});

		it('should accept rerollBank input', () => {
			fixture.componentRef.setInput('rerollBank', 3);
			fixture.detectChanges();
			expect(component.rerollBank()).toBe(3);
		});

		it('should accept rerollBankMax input', () => {
			fixture.componentRef.setInput('rerollBankMax', 5);
			fixture.detectChanges();
			expect(component.rerollBankMax()).toBe(5);
		});
	});

	describe('outputs', () => {
		it('should emit roll event', (done) => {
			component.roll.subscribe(() => {
				expect(true).toBe(true);
				done();
			});

			component.onRoll();
		});

		it('should emit retry event', (done) => {
			component.retry.subscribe(() => {
				expect(true).toBe(true);
				done();
			});

			component.onRetry();
		});

		it('should emit copyDraft event', (done) => {
			component.copyDraft.subscribe(() => {
				expect(true).toBe(true);
				done();
			});

			component.onCopyDraft();
		});
	});

	describe('rerollPercentage', () => {
		it('should calculate percentage correctly', () => {
			fixture.componentRef.setInput('rerollBank', 3);
			fixture.componentRef.setInput('rerollBankMax', 5);
			fixture.detectChanges();

			expect(component.rerollPercentage).toBe(60);
		});

		it('should return 0 when max is 0', () => {
			fixture.componentRef.setInput('rerollBank', 0);
			fixture.componentRef.setInput('rerollBankMax', 0);
			fixture.detectChanges();

			expect(component.rerollPercentage).toBe(0);
		});

		it('should return 100 when bank equals max', () => {
			fixture.componentRef.setInput('rerollBank', 5);
			fixture.componentRef.setInput('rerollBankMax', 5);
			fixture.detectChanges();

			expect(component.rerollPercentage).toBe(100);
		});

		it('should return 0 when bank is 0', () => {
			fixture.componentRef.setInput('rerollBank', 0);
			fixture.componentRef.setInput('rerollBankMax', 5);
			fixture.detectChanges();

			expect(component.rerollPercentage).toBe(0);
		});
	});

	describe('template rendering', () => {
		it('should show loading status when loading', () => {
			fixture.componentRef.setInput('isLoading', true);
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			expect(compiled.textContent).toContain('Loading champion data');
		});

		it('should display error message when present', () => {
			const errorMessage = 'Test error message';
			fixture.componentRef.setInput('loadError', errorMessage);
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			expect(compiled.textContent).toContain(errorMessage);
		});

		it('should show progress spinner', () => {
			fixture.componentRef.setInput('rerollBank', 3);
			fixture.componentRef.setInput('rerollBankMax', 5);
			fixture.detectChanges();

			const spinner = fixture.nativeElement.querySelector('mat-progress-spinner');
			expect(spinner).toBeTruthy();
		});
	});
});
