import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { SerializedRoomState, Player } from '../types/multiplayer.types';
import { Lane } from '../data/champions.data';

@Injectable({
	providedIn: 'root',
})
export class MultiplayerService {
	private socket: Socket | null = null;
	
	// Signals for multiplayer state
	public readonly isConnected = signal<boolean>(false);
	public readonly isInRoom = signal<boolean>(false);
	public readonly currentRoomId = signal<string | null>(null);
	public readonly roomState = signal<SerializedRoomState | null>(null);
	public readonly isMultiplayerMode = signal<boolean>(false);

	constructor() {
		// Only initialize on browser
		if (typeof window !== 'undefined') {
			this.initializeSocket();
		}
	}

	private initializeSocket(): void {
		const serverUrl = window.location.origin;
		this.socket = io(serverUrl, {
			autoConnect: false,
		});

		this.socket.on('connect', () => {
			this.isConnected.set(true);
			console.log('Connected to multiplayer server');
		});

		this.socket.on('disconnect', () => {
			this.isConnected.set(false);
			console.log('Disconnected from multiplayer server');
		});

		this.socket.on('roomState', (state: SerializedRoomState) => {
			this.roomState.set(state);
		});

		this.socket.on('playerJoined', (player: Player) => {
			console.log('Player joined:', player.name);
		});

		this.socket.on('playerLeft', (playerId: string) => {
			console.log('Player left:', playerId);
			// If the room state becomes null, exit multiplayer mode
			const currentState = this.roomState();
			if (currentState && currentState.players.length === 0) {
				this.leaveMultiplayerMode();
			}
		});

		this.socket.on('error', (message: string) => {
			console.error('Multiplayer error:', message);
		});
	}

	public async createRoom(playerName: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
		return new Promise((resolve) => {
			if (!this.socket) {
				resolve({ success: false, error: 'Socket not initialized' });
				return;
			}

			if (!this.socket.connected) {
				this.socket.connect();
			}

			this.socket.emit('createRoom', playerName, (response: { success: boolean; roomId?: string; error?: string }) => {
				if (response.success && response.roomId) {
					this.isInRoom.set(true);
					this.isMultiplayerMode.set(true);
					this.currentRoomId.set(response.roomId);
				}
				resolve(response);
			});
		});
	}

	public async joinRoom(roomId: string, playerName: string): Promise<{ success: boolean; error?: string }> {
		return new Promise((resolve) => {
			if (!this.socket) {
				resolve({ success: false, error: 'Socket not initialized' });
				return;
			}

			if (!this.socket.connected) {
				this.socket.connect();
			}

			this.socket.emit('joinRoom', roomId, playerName, (response: { success: boolean; error?: string }) => {
				if (response.success) {
					this.isInRoom.set(true);
					this.isMultiplayerMode.set(true);
					this.currentRoomId.set(roomId);
				}
				resolve(response);
			});
		});
	}

	public async leaveRoom(): Promise<{ success: boolean; error?: string }> {
		return new Promise((resolve) => {
			if (!this.socket) {
				resolve({ success: false, error: 'Socket not initialized' });
				return;
			}

			this.socket.emit('leaveRoom', (response: { success: boolean; error?: string }) => {
				if (response.success) {
					this.leaveMultiplayerMode();
				}
				resolve(response);
			});
		});
	}

	public async selectLane(lane: Lane): Promise<{ success: boolean; error?: string }> {
		return new Promise((resolve) => {
			if (!this.socket) {
				resolve({ success: false, error: 'Socket not initialized' });
				return;
			}

			this.socket.emit('selectLane', lane, resolve);
		});
	}

	public async toggleLane(lane: Lane): Promise<{ success: boolean; error?: string }> {
		return new Promise((resolve) => {
			if (!this.socket) {
				resolve({ success: false, error: 'Socket not initialized' });
				return;
			}

			this.socket.emit('toggleLane', lane, resolve);
		});
	}

	public async rerollLane(lane: Lane): Promise<{ success: boolean; error?: string }> {
		return new Promise((resolve) => {
			if (!this.socket) {
				resolve({ success: false, error: 'Socket not initialized' });
				return;
			}

			this.socket.emit('rerollLane', lane, resolve);
		});
	}

	public async rollAllAssignments(): Promise<{ success: boolean; error?: string }> {
		return new Promise((resolve) => {
			if (!this.socket) {
				resolve({ success: false, error: 'Socket not initialized' });
				return;
			}

			this.socket.emit('rollAllAssignments', resolve);
		});
	}

	private leaveMultiplayerMode(): void {
		this.isInRoom.set(false);
		this.isMultiplayerMode.set(false);
		this.currentRoomId.set(null);
		this.roomState.set(null);
		if (this.socket?.connected) {
			this.socket.disconnect();
		}
	}
}
