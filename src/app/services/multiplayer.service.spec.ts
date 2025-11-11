import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MultiplayerService } from './multiplayer.service';

describe('MultiplayerService', () => {
	let service: MultiplayerService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()],
		});
		service = TestBed.inject(MultiplayerService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should initialize with default state', () => {
		expect(service.isConnected()).toBe(false);
		expect(service.isInRoom()).toBe(false);
		expect(service.currentRoomId()).toBeNull();
		expect(service.isMultiplayerMode()).toBe(false);
	});

	it('should have roomState signal', () => {
		expect(service.roomState()).toBeNull();
	});
});
