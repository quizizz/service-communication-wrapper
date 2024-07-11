export declare enum METHOD {
    POST = "post",
    GET = "get",
    DELETE = "delete",
    PATCH = "patch",
    PUT = "put"
}
export declare function generateHexString(size: number): string;
/**
 * createRequestURL creates a url given query parameters
 */
export declare function createRequestURL(url: string, query?: string | Record<string, string> | string[][] | URLSearchParams): string;
