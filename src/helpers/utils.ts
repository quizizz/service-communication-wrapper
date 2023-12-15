import crypto from 'crypto';

export enum METHOD {
	POST = 'post',
	GET = 'get',
	DELETE = 'delete',
	PATCH = 'patch',
	PUT = 'put',
}

export function generateHexString(size: number): string {
	return crypto.randomBytes(size).toString("hex");
}

/**
 * createRequestURL creates a url given query parameters
 */
export function createRequestURL(url: string, query?: string | Record<string, string> | string[][] | URLSearchParams) {
	const searchParams = new URLSearchParams(query);
	const finalURL = new URL(url);
	finalURL.search = searchParams.toString();
	return finalURL.toString();
}
