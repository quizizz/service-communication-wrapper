/// <reference types="node" />
import CircuitBreaker from 'opossum';
import { Axios, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from 'axios';
import { AsyncLocalStorage } from 'node:async_hooks';
type RequestErrorHandler = (params: Record<string, any>, response: AxiosResponse) => void;
declare enum METHOD {
    POST = "post",
    GET = "get",
    DELETE = "delete",
    PATCH = "patch",
    PUT = "put"
}
interface CircuitBreakerConfig extends CircuitBreaker.Options {
    disable?: boolean;
}
interface HTTPCommunicationConfig {
    name: string;
    axiosConfig?: AxiosRequestConfig;
    contextStorage?: AsyncLocalStorage<any>;
    errorHandler?: RequestErrorHandler;
    circuitBreakerConfig?: CircuitBreakerConfig;
}
declare const HTTPCommunicationAxiosDefaultConfig: AxiosRequestConfig;
/**
 * Request
 */
interface Request {
    user?: {
        id?: string;
    };
    get(key: string): any;
    route?: {
        path?: string;
    };
}
/**
 * HTTPRequest is the structure of the incoming request
 */
interface HTTPRequest extends Record<string, any> {
    body?: any;
    query?: string | Record<string, string> | string[][] | URLSearchParams | undefined;
}
/**
 * HTTPCommunication wrapper
 */
declare class HTTPCommunication {
    name: string;
    axiosClient: Axios;
    axiosConfig?: AxiosRequestConfig;
    contextStorage?: AsyncLocalStorage<any>;
    errorHandler?: RequestErrorHandler;
    private fallbackFunction;
    private circuitBreaker;
    /**
     * HTTPCommunication to communicate with another service
     */
    constructor({ name, axiosConfig, contextStorage, errorHandler, circuitBreakerConfig }: HTTPCommunicationConfig);
    /**
     * Function to generate the context object
     * @param req Express request
     * @param customContextValue any custom values that you want to store in the context
     * Return extracted values from the req headers and any custom values pass to generate the context object
     */
    static getRequestContext(req: Request, customContextValue?: Record<string, unknown>): Record<string, any>;
    static generateHexString(size: number): string;
    /**
     * handleError handles all errors
     */
    private handleError;
    /**
     * createRequestURL creates a url given query parameters
     */
    createRequestURL(url: string, query?: string | Record<string, string> | string[][] | URLSearchParams): string;
    /**
     * populateHeadersFromContext takes context provided from AsyncLocalStorage, and populates relevant headers
     */
    populateHeadersFromContext(ctx?: {
        traceId?: string;
        userId?: string;
        ab?: string;
        debug?: boolean;
        requestContextToken?: string;
    }): Record<string, any>;
    /**
     * makeRequest prepares and fires a request
     **/
    private makeRequest;
    /**
     * HTTP POST Request
     */
    post<T>(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders): Promise<T>;
    /**
     * HTTP PUT Request
     */
    put<T>(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders): Promise<T>;
    /**
     * HTTP PATCH Request
     */
    patch<T>(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders): Promise<T>;
    /**
     * HTTP DELETE Request
     */
    delete<T>(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders): Promise<T>;
    /**
     * HTTP POST Request
     **/
    get<T>(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders): Promise<T>;
    executeHTTPRequest(method: METHOD, route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders): Promise<any>;
}
export { HTTPRequest, RequestErrorHandler, CircuitBreakerConfig, HTTPCommunicationConfig, METHOD, HTTPCommunicationAxiosDefaultConfig, Request, HTTPCommunication, HTTPCommunication as HttpCommunication, };
