export const LANES = ['top', 'jungle', 'mid', 'adc', 'support'] as const;

export type Lane = (typeof LANES)[number];

export interface Champion {
	readonly id: string;
	readonly name: string;
	readonly roles: ReadonlyArray<Lane>;
	readonly icon: string;
}

export const CHAMPION_DATA_URL = '/api/champions';
