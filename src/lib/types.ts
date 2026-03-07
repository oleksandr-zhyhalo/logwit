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

export type UserPreference = {
	id: number;
	userId: string;
	sourceId: number | null;
	displayFields: string[] | null;
	quickFilterFields: string[] | null;
	createdAt: Date;
	updatedAt: Date;
};
