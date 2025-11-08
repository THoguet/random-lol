import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LaneCardComponent } from './lane-card.component';
import { Champion } from '../../data/champions.data';

describe('LaneCardComponent', () => {
	let component: LaneCardComponent;
	let fixture: ComponentFixture<LaneCardComponent>;

	const mockChampion: Champion = {
		id: 'Aatrox',
		name: 'Aatrox',
		roles: ['top', 'jungle'],
		icon: 'https://example.com/aatrox.png',
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [LaneCardComponent],
			providers: [provideZonelessChangeDetection()],
		}).compileComponents();

		fixture = TestBed.createComponent(LaneCardComponent);
		component = fixture.componentInstance;

		// Set required inputs
		fixture.componentRef.setInput('lane', 'top');
		fixture.componentRef.setInput('laneLabel', 'Top Lane');

		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('inputs', () => {
		it('should accept lane input', () => {
			fixture.componentRef.setInput('lane', 'mid');
			fixture.detectChanges();
			expect(component.lane()).toBe('mid');
		});

		it('should accept laneLabel input', () => {
			fixture.componentRef.setInput('laneLabel', 'Mid Lane');
			fixture.detectChanges();
			expect(component.laneLabel()).toBe('Mid Lane');
		});

		it('should accept champion input', () => {
			fixture.componentRef.setInput('champion', mockChampion);
			fixture.detectChanges();
			expect(component.champion()).toBe(mockChampion);
		});

		it('should accept null champion', () => {
			fixture.componentRef.setInput('champion', null);
			fixture.detectChanges();
			expect(component.champion()).toBeNull();
		});

		it('should accept canReRoll input', () => {
			fixture.componentRef.setInput('canReRoll', true);
			fixture.detectChanges();
			expect(component.canReRoll()).toBe(true);
		});

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

		it('should accept isShiftPressed input', () => {
			fixture.componentRef.setInput('isShiftPressed', true);
			fixture.detectChanges();
			expect(component.isShiftPressed()).toBe(true);
		});

		it('should accept disabled input', () => {
			fixture.componentRef.setInput('disabled', true);
			fixture.detectChanges();
			expect(component.disabled()).toBe(true);
		});
	});

	describe('outputs', () => {
		it('should emit changeChampion event', (done) => {
			component.changeChampion.subscribe((event) => {
				expect(event.lane).toBe('top');
				expect(event.forceReroll).toBe(false);
				done();
			});

			component.onChangeChampion();
		});

		it('should emit changeChampion with forceReroll true', (done) => {
			component.changeChampion.subscribe((event) => {
				expect(event.lane).toBe('top');
				expect(event.forceReroll).toBe(true);
				done();
			});

			component.onChangeChampion(true);
		});

		it('should emit toggleDisableLane event', (done) => {
			component.toggleDisableLane.subscribe((lane) => {
				expect(lane).toBe('top');
				done();
			});

			component.onToggleDisableLane();
		});
	});

	describe('roleLabel', () => {
		it('should return correct label for top', () => {
			expect(component.roleLabel('top')).toBe('Top Lane');
		});

		it('should return correct label for jungle', () => {
			expect(component.roleLabel('jungle')).toBe('Jungle');
		});

		it('should return correct label for mid', () => {
			expect(component.roleLabel('mid')).toBe('Mid Lane');
		});

		it('should return correct label for adc', () => {
			expect(component.roleLabel('adc')).toBe('Bot Carry');
		});

		it('should return correct label for support', () => {
			expect(component.roleLabel('support')).toBe('Support');
		});
	});

	describe('template rendering', () => {
		it('should display champion name when champion is provided', () => {
			fixture.componentRef.setInput('champion', mockChampion);
			fixture.detectChanges();

			const compiled = fixture.nativeElement as HTMLElement;
			expect(compiled.textContent).toContain('Aatrox');
		});

		it('should display champion image when champion is provided', () => {
			fixture.componentRef.setInput('champion', mockChampion);
			fixture.detectChanges();

			const img = fixture.nativeElement.querySelector('img');
			expect(img).toBeTruthy();
			if (img) {
				expect(img.src || img.getAttribute('ng-reflect-ng-src')).toContain('aatrox.png');
			}
		});

		it('should display lane label', () => {
			const compiled = fixture.nativeElement as HTMLElement;
			expect(compiled.textContent).toContain('Top Lane');
		});

		it('should display role chips when champion has roles', () => {
			fixture.componentRef.setInput('champion', mockChampion);
			fixture.detectChanges();

			const chips = fixture.nativeElement.querySelectorAll('mat-chip');
			expect(chips.length).toBeGreaterThan(0);
		});

		it('should apply disabled styling when disabled', () => {
			fixture.componentRef.setInput('disabled', true);
			fixture.detectChanges();

			const card = fixture.nativeElement.querySelector('mat-card');
			expect(card?.classList.contains('disabled-card')).toBe(true);
		});
	});
});
