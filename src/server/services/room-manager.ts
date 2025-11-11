import { Lane, Champion, LANES } from '../../app/data/champions.data';
import { Player, RoomState, SerializedRoomState } from '../types/multiplayer.types';
import { RandomNumber } from '../../app/services/random-number';

export class RoomManager {
	private rooms = new Map<string, RoomState>();
	private championData: Champion[] = [];

	setChampionData(champions: Champion[]): void {
		this.championData = champions;
	}

	getChampionData(): Champion[] {
		return this.championData;
	}

	createRoom(ownerId: string, ownerName: string): string {
		const roomId = this.generateRoomId();
		const player: Player = {
			id: ownerId,
			name: ownerName,
		};

		const room: RoomState = {
			roomId,
			ownerId,
			players: new Map([[ownerId, player]]),
			assignments: this.createEmptyAssignments(),
			disabledLanes: new Set(),
			reRollBank: LANES.length,
			reRollBankMax: LANES.length,
		};

		this.rooms.set(roomId, room);
		return roomId;
	}

	joinRoom(roomId: string, playerId: string, playerName: string): RoomState | null {
		const room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		const player: Player = {
			id: playerId,
			name: playerName,
		};

		const updatedPlayers = new Map(room.players);
		updatedPlayers.set(playerId, player);

		const updatedRoom: RoomState = {
			...room,
			players: updatedPlayers,
		};

		this.rooms.set(roomId, updatedRoom);
		return updatedRoom;
	}

	leaveRoom(roomId: string, playerId: string): RoomState | null {
		const room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		const updatedPlayers = new Map(room.players);
		const player = updatedPlayers.get(playerId);
		updatedPlayers.delete(playerId);

		// If room is empty or owner left, delete the room
		if (updatedPlayers.size === 0 || playerId === room.ownerId) {
			this.rooms.delete(roomId);
			return null;
		}

		// Clear lane selection if player had one
		if (player?.selectedLane) {
			const updatedAssignments = new Map(room.assignments);
			updatedAssignments.set(player.selectedLane, null);

			const updatedRoom: RoomState = {
				...room,
				players: updatedPlayers,
				assignments: updatedAssignments,
			};

			this.rooms.set(roomId, updatedRoom);
			return updatedRoom;
		}

		const updatedRoom: RoomState = {
			...room,
			players: updatedPlayers,
		};

		this.rooms.set(roomId, updatedRoom);
		return updatedRoom;
	}

	getRoom(roomId: string): RoomState | null {
		return this.rooms.get(roomId) || null;
	}

	selectLane(roomId: string, playerId: string, lane: Lane): RoomState | null {
		const room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		const player = room.players.get(playerId);
		if (!player) {
			return null;
		}

		// Check if lane is already taken by another player
		const laneOccupied = Array.from(room.players.values()).some(
			(p) => p.id !== playerId && p.selectedLane === lane,
		);

		if (laneOccupied) {
			return null;
		}

		// Update player's lane selection
		const updatedPlayers = new Map(room.players);
		updatedPlayers.set(playerId, {
			...player,
			selectedLane: lane,
		});

		const updatedRoom: RoomState = {
			...room,
			players: updatedPlayers,
		};

		this.rooms.set(roomId, updatedRoom);
		return updatedRoom;
	}

	toggleLane(roomId: string, lane: Lane): RoomState | null {
		const room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		const updatedDisabledLanes = new Set(room.disabledLanes);
		let updatedReRollBank = room.reRollBank;

		if (updatedDisabledLanes.has(lane)) {
			updatedDisabledLanes.delete(lane);
			updatedReRollBank++;
		} else {
			updatedDisabledLanes.add(lane);
			updatedReRollBank--;
		}

		const updatedAssignments = new Map(room.assignments);
		updatedAssignments.set(lane, null);

		const updatedRoom: RoomState = {
			...room,
			disabledLanes: updatedDisabledLanes,
			assignments: updatedAssignments,
			reRollBank: updatedReRollBank,
		};

		this.rooms.set(roomId, updatedRoom);
		return updatedRoom;
	}

	rerollLane(roomId: string, lane: Lane): RoomState | null {
		const room = this.rooms.get(roomId);
		if (!room || room.reRollBank <= 0) {
			return null;
		}

		const champion = this.getRandomChampionForLane(lane, room);
		if (!champion) {
			return room;
		}

		const updatedAssignments = new Map(room.assignments);
		updatedAssignments.set(lane, champion);

		const updatedRoom: RoomState = {
			...room,
			assignments: updatedAssignments,
			reRollBank: room.reRollBank - 1,
		};

		this.rooms.set(roomId, updatedRoom);
		return updatedRoom;
	}

	rollAllAssignments(roomId: string): RoomState | null {
		const room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

		const activeLanes = LANES.filter((lane) => !room.disabledLanes.has(lane));
		const selected = new Set<string>();
		const updatedAssignments = this.createEmptyAssignments();

		for (const lane of activeLanes) {
			const candidates = this.getChampionsForLane(lane).filter(
				(champion) => !selected.has(champion.name),
			);

			if (candidates.length === 0) {
				updatedAssignments.set(lane, null);
				continue;
			}

			const champion = candidates[RandomNumber.getSecureRandomInt(candidates.length)];
			updatedAssignments.set(lane, champion);
			selected.add(champion.name);
		}

		const updatedRoom: RoomState = {
			...room,
			assignments: updatedAssignments,
			reRollBank: activeLanes.length,
			reRollBankMax: activeLanes.length,
		};

		this.rooms.set(roomId, updatedRoom);
		return updatedRoom;
	}

	serializeRoomState(room: RoomState): SerializedRoomState {
		return {
			roomId: room.roomId,
			ownerId: room.ownerId,
			players: Array.from(room.players.values()),
			assignments: Object.fromEntries(room.assignments) as Record<Lane, Champion | null>,
			disabledLanes: Array.from(room.disabledLanes),
			reRollBank: room.reRollBank,
			reRollBankMax: room.reRollBankMax,
		};
	}

	private getRandomChampionForLane(lane: Lane, room: RoomState): Champion | null {
		const usedChampions = new Set(
			Array.from(room.assignments.values())
				.filter((c): c is Champion => c !== null)
				.map((c) => c.name),
		);

		const candidates = this.getChampionsForLane(lane).filter(
			(champion) => !usedChampions.has(champion.name),
		);

		if (candidates.length === 0) {
			return null;
		}

		return candidates[RandomNumber.getSecureRandomInt(candidates.length)];
	}

	private getChampionsForLane(lane: Lane): Champion[] {
		return this.championData.filter((champion) => champion.roles.includes(lane));
	}

	private createEmptyAssignments(): Map<Lane, Champion | null> {
		return new Map<Lane, Champion | null>([
			['top', null],
			['jungle', null],
			['mid', null],
			['adc', null],
			['support', null],
		]);
	}

	private generateRoomId(): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let roomId: string;
		do {
			roomId = Array.from({ length: 6 }, () =>
				chars.charAt(RandomNumber.getSecureRandomInt(chars.length)),
			).join('');
		} while (this.rooms.has(roomId));
		return roomId;
	}
}
