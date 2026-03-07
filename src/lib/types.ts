export type Source = {
	id: number;
	name: string;
	url: string;
	indexName: string;
	levelField: string;
	timestampField: string;
	messageField: string;
	createdAt: Date;
	updatedAt: Date;
};

export type UserFieldPreference = {
	id: number;
	userId: string;
	sourceId: number | null;
	fields: string[];
	createdAt: Date;
	updatedAt: Date;
};
