import { AxiosRequestConfig } from 'axios';

export class HttpCommunication {
    /**
     * HttpCommunication to communicate with another service
     * @param name
     * @param axiosConfig
     * @param contextStorage {AsyncLocalStorage}
     */
    constructor({ name, axiosConfig, contextStorage } : { name: string, axiosConfig?: AxiosRequestConfig, contextStorage?: any });

    /**
     * Function to generate the context object
     * @param req {Express Request}
     * @param customContextValue any custom values that you want to store in the context
     * Return extracted values from the req headers and any custom values pass to generate the context object
     */
    static getRequestContext(req: any, customContextValue?: Record<string, unknown>): { traceId: string, spanId: string, userId: string, ab: string, reqStartTime: number };

    /**
     * Http Get Request
     * @param route
     * @param request
     * @typeParam T - Response type provided by the callee
     * @returns Returns response of the get request
     */
    get<T>(route: string, request?: { query: Record<string, string> }): Promise<T>;

    /**
     * Http Put Request
     * @param route
     * @param request
     * @typeParam T - Response type provided by the callee
     * @returns Returns response of the put request
     */
    put<T>(route: string, request: { query: Record<string, string>, body: Record<string, unknown> }): Promise<T>;

    /**
     * Http Delete Request
     * @param route
     * @param request
     * @typeParam T - Response type provided by the callee
     * @returns Returns response of the put request
     */
    delete<T>(route: string, request: { query: Record<string, string>, body: Record<string, unknown> }): Promise<T>;

     /**
     * Http Patch Request
     * @param route
     * @param request
     * @typeParam T - Response type provided by the callee
     * @returns Returns response of the put request
     */
    patch<T>(route: string, request: { query: Record<string, string>, body: Record<string, unknown> }): Promise<T>;

    /**
     * Http Post Request
     * @param route
     * @param request
     * @typeParam T - Response type provided by the callee
     * @returns Returns response of the post request
     */
    post<T>(route: string, request: { query: Record<string, string>, body: Record<string, unknown> }): Promise<T>;
}