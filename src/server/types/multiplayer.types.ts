import { Lane, Champion } from '../../app/data/champions.data';

export interface Player {
	readonly id: string;
	readonly name: string;
	readonly selectedLane?: Lane;
}

export interface RoomState {
	readonly roomId: string;
	readonly ownerId: string;
	readonly players: Map<string, Player>;
	readonly assignments: Map<Lane, Champion | null>;
	readonly disabledLanes: Set<Lane>;
	readonly reRollBank: number;
	readonly reRollBankMax: number;
}

export interface RoomInfo {
	readonly roomId: string;
	readonly ownerId: string;
	readonly playerCount: number;
}

// Client-to-Server events
export interface ClientToServerEvents {
	createRoom: (playerName: string, callback: (response: { success: boolean; roomId?: string; error?: string }) => void) => void;
	joinRoom: (roomId: string, playerName: string, callback: (response: { success: boolean; error?: string }) => void) => void;
	leaveRoom: (callback: (response: { success: boolean; error?: string }) => void) => void;
	selectLane: (lane: Lane, callback: (response: { success: boolean; error?: string }) => void) => void;
	toggleLane: (lane: Lane, callback: (response: { success: boolean; error?: string }) => void) => void;
	rerollLane: (lane: Lane, callback: (response: { success: boolean; error?: string }) => void) => void;
	rollAllAssignments: (callback: (response: { success: boolean; error?: string }) => void) => void;
}

// Server-to-Client events
export interface ServerToClientEvents {
	roomState: (state: SerializedRoomState) => void;
	playerJoined: (player: Player) => void;
	playerLeft: (playerId: string) => void;
	error: (message: string) => void;
}

// Serialized version of RoomState for transmission
export interface SerializedRoomState {
	readonly roomId: string;
	readonly ownerId: string;
	readonly players: Player[];
	readonly assignments: Record<Lane, Champion | null>;
	readonly disabledLanes: Lane[];
	readonly reRollBank: number;
	readonly reRollBankMax: number;
}
