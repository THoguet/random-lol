import { Lane, Champion } from '../data/champions.data';

export interface Player {
	readonly id: string;
	readonly name: string;
	readonly selectedLane?: Lane;
}

export interface SerializedRoomState {
	readonly roomId: string;
	readonly ownerId: string;
	readonly players: Player[];
	readonly assignments: Record<Lane, Champion | null>;
	readonly disabledLanes: Lane[];
	readonly reRollBank: number;
	readonly reRollBankMax: number;
}
