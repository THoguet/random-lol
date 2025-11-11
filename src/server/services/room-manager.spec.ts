import { RoomManager } from './room-manager';
import { Champion, Lane } from '../../app/data/champions.data';

describe('RoomManager', () => {
	let roomManager: RoomManager;
	const mockChampions: Champion[] = [
		{ id: '1', name: 'Champion1', roles: ['top', 'jungle'], icon: 'icon1' },
		{ id: '2', name: 'Champion2', roles: ['mid'], icon: 'icon2' },
		{ id: '3', name: 'Champion3', roles: ['adc', 'support'], icon: 'icon3' },
	];

	beforeEach(() => {
		roomManager = new RoomManager();
		roomManager.setChampionData(mockChampions);
	});

	it('should create a room', () => {
		const roomId = roomManager.createRoom('owner123', 'PlayerOne');
		expect(roomId).toBeTruthy();
		expect(roomId.length).toBe(6);

		const room = roomManager.getRoom(roomId);
		expect(room).toBeTruthy();
		expect(room?.ownerId).toBe('owner123');
		expect(room?.players.size).toBe(1);
	});

	it('should allow a player to join a room', () => {
		const roomId = roomManager.createRoom('owner123', 'PlayerOne');
		const result = roomManager.joinRoom(roomId, 'player456', 'PlayerTwo');

		expect(result).toBeTruthy();
		expect(result?.players.size).toBe(2);
	});

	it('should return null when joining non-existent room', () => {
		const result = roomManager.joinRoom('INVALID', 'player456', 'PlayerTwo');
		expect(result).toBeNull();
	});

	it('should allow a player to leave a room', () => {
		const roomId = roomManager.createRoom('owner123', 'PlayerOne');
		roomManager.joinRoom(roomId, 'player456', 'PlayerTwo');

		const result = roomManager.leaveRoom(roomId, 'player456');
		expect(result).toBeTruthy();
		expect(result?.players.size).toBe(1);
	});

	it('should delete room when owner leaves', () => {
		const roomId = roomManager.createRoom('owner123', 'PlayerOne');
		roomManager.joinRoom(roomId, 'player456', 'PlayerTwo');

		const result = roomManager.leaveRoom(roomId, 'owner123');
		expect(result).toBeNull();
		expect(roomManager.getRoom(roomId)).toBeNull();
	});

	it('should toggle lane disabled state', () => {
		const roomId = roomManager.createRoom('owner123', 'PlayerOne');
		const room = roomManager.getRoom(roomId);
		expect(room?.disabledLanes.has('top' as Lane)).toBe(false);

		const updated = roomManager.toggleLane(roomId, 'top' as Lane);
		expect(updated?.disabledLanes.has('top' as Lane)).toBe(true);

		const toggled = roomManager.toggleLane(roomId, 'top' as Lane);
		expect(toggled?.disabledLanes.has('top' as Lane)).toBe(false);
	});

	it('should roll assignments for all active lanes', () => {
		const roomId = roomManager.createRoom('owner123', 'PlayerOne');
		const result = roomManager.rollAllAssignments(roomId);

		expect(result).toBeTruthy();
		expect(result?.assignments.size).toBe(5);
	});

	it('should serialize room state correctly', () => {
		const roomId = roomManager.createRoom('owner123', 'PlayerOne');
		const room = roomManager.getRoom(roomId);
		expect(room).toBeTruthy();

		const serialized = roomManager.serializeRoomState(room!);
		expect(serialized.roomId).toBe(roomId);
		expect(serialized.ownerId).toBe('owner123');
		expect(serialized.players.length).toBe(1);
		expect(Array.isArray(serialized.disabledLanes)).toBe(true);
	});
});
