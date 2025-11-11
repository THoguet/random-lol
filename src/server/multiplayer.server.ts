import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from './services/room-manager';
import {
	ClientToServerEvents,
	ServerToClientEvents,
	SerializedRoomState,
} from './types/multiplayer.types';
import { Lane } from '../app/data/champions.data';

type SocketType = Socket<ClientToServerEvents, ServerToClientEvents>;

export class MultiplayerServer {
	private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
	private roomManager: RoomManager;
	private socketToRoom = new Map<string, string>();

	constructor(httpServer: HttpServer) {
		this.io = new SocketIOServer(httpServer, {
			cors: {
				origin: '*', // In production, restrict this to your domain
				methods: ['GET', 'POST'],
			},
		});

		this.roomManager = new RoomManager();
		this.setupSocketHandlers();
	}

	setChampionData(champions: any[]): void {
		this.roomManager.setChampionData(champions);
	}

	private setupSocketHandlers(): void {
		this.io.on('connection', (socket: SocketType) => {
			console.log('Client connected:', socket.id);

			// Create room
			socket.on('createRoom', (playerName, callback) => {
				try {
					const roomId = this.roomManager.createRoom(socket.id, playerName);
					this.socketToRoom.set(socket.id, roomId);
					socket.join(roomId);

					const room = this.roomManager.getRoom(roomId);
					if (room) {
						callback({ success: true, roomId });
						socket.emit('roomState', this.roomManager.serializeRoomState(room));
					}
				} catch (error) {
					callback({ success: false, error: 'Failed to create room' });
				}
			});

			// Join room
			socket.on('joinRoom', (roomId, playerName, callback) => {
				try {
					const room = this.roomManager.joinRoom(roomId, socket.id, playerName);
					if (!room) {
						callback({ success: false, error: 'Room not found' });
						return;
					}

					this.socketToRoom.set(socket.id, roomId);
					socket.join(roomId);

					callback({ success: true });

					// Notify all players in the room about the new player
					const player = room.players.get(socket.id);
					if (player) {
						socket.to(roomId).emit('playerJoined', player);
					}

					// Send current room state to the new player
					socket.emit('roomState', this.roomManager.serializeRoomState(room));
				} catch (error) {
					callback({ success: false, error: 'Failed to join room' });
				}
			});

			// Leave room
			socket.on('leaveRoom', (callback) => {
				this.handleLeaveRoom(socket, callback);
			});

			// Select lane
			socket.on('selectLane', (lane: Lane, callback) => {
				try {
					const roomId = this.socketToRoom.get(socket.id);
					if (!roomId) {
						callback({ success: false, error: 'Not in a room' });
						return;
					}

					const room = this.roomManager.selectLane(roomId, socket.id, lane);
					if (!room) {
						callback({ success: false, error: 'Failed to select lane' });
						return;
					}

					callback({ success: true });
					this.broadcastRoomState(roomId, room);
				} catch (error) {
					callback({ success: false, error: 'Failed to select lane' });
				}
			});

			// Toggle lane
			socket.on('toggleLane', (lane: Lane, callback) => {
				try {
					const roomId = this.socketToRoom.get(socket.id);
					if (!roomId) {
						callback({ success: false, error: 'Not in a room' });
						return;
					}

					const room = this.roomManager.toggleLane(roomId, lane);
					if (!room) {
						callback({ success: false, error: 'Failed to toggle lane' });
						return;
					}

					callback({ success: true });
					this.broadcastRoomState(roomId, room);
				} catch (error) {
					callback({ success: false, error: 'Failed to toggle lane' });
				}
			});

			// Reroll lane
			socket.on('rerollLane', (lane: Lane, callback) => {
				try {
					const roomId = this.socketToRoom.get(socket.id);
					if (!roomId) {
						callback({ success: false, error: 'Not in a room' });
						return;
					}

					const room = this.roomManager.rerollLane(roomId, lane);
					if (!room) {
						callback({ success: false, error: 'Failed to reroll lane' });
						return;
					}

					callback({ success: true });
					this.broadcastRoomState(roomId, room);
				} catch (error) {
					callback({ success: false, error: 'Failed to reroll lane' });
				}
			});

			// Roll all assignments
			socket.on('rollAllAssignments', (callback) => {
				try {
					const roomId = this.socketToRoom.get(socket.id);
					if (!roomId) {
						callback({ success: false, error: 'Not in a room' });
						return;
					}

					const room = this.roomManager.rollAllAssignments(roomId);
					if (!room) {
						callback({ success: false, error: 'Failed to roll assignments' });
						return;
					}

					callback({ success: true });
					this.broadcastRoomState(roomId, room);
				} catch (error) {
					callback({ success: false, error: 'Failed to roll assignments' });
				}
			});

			// Handle disconnect
			socket.on('disconnect', () => {
				console.log('Client disconnected:', socket.id);
				this.handleLeaveRoom(socket);
			});
		});
	}

	private handleLeaveRoom(socket: SocketType, callback?: (response: { success: boolean; error?: string }) => void): void {
		try {
			const roomId = this.socketToRoom.get(socket.id);
			if (!roomId) {
				callback?.({ success: true });
				return;
			}

			const room = this.roomManager.leaveRoom(roomId, socket.id);
			this.socketToRoom.delete(socket.id);
			socket.leave(roomId);

			if (room) {
				// Room still exists, broadcast updated state
				socket.to(roomId).emit('playerLeft', socket.id);
				this.broadcastRoomState(roomId, room);
			}

			callback?.({ success: true });
		} catch (error) {
			callback?.({ success: false, error: 'Failed to leave room' });
		}
	}

	private broadcastRoomState(roomId: string, room: any): void {
		const serialized: SerializedRoomState = this.roomManager.serializeRoomState(room);
		this.io.to(roomId).emit('roomState', serialized);
	}
}
