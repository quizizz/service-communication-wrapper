/**
 * ServerRequest is original server request which triggered this outgoing API call.
 * It contains data like headers containing user id, trace id, route, path etc.
 */
export interface ServerRequest {
    user?: {
        id?: string;
    };
    get(key: string): any;
    route?: {
        path?: string;
    };
}
/**
 * DefaultContextValue is the structure of the context value from the local context store.
 * This is built during the request processing using the server request.
 */
export interface DefaultContextValue {
    traceId: string;
    spanId: string;
    reqStartTime: number;
    userId?: string;
    ab: string;
    debug?: string;
    requestContextToken?: string;
    path?: string;
}
/**
     * Function to generate the context object
     * @param req Express request
     * @param customContextValue any custom values that you want to store in the context
     * Return extracted values from the req headers and any custom values pass to generate the context object
     */
export declare function getRequestContext<T>(req: ServerRequest, customContextValue?: T): DefaultContextValue & T;
