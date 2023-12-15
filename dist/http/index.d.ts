/// <reference types="node" />
import CircuitBreaker from 'opossum';
import { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AsyncLocalStorage } from 'node:async_hooks';
import PrometheusMetrics from 'opossum-prometheus';
import { METHOD, createRequestURL, generateHexString } from '../helpers/utils';
import { CircuitOpenError, CircuitBreakerDefaultFallbackFunction } from '../helpers/circuit-breaker-utils';
import { getRequestContext } from '../helpers/request-context';
import { Registry } from 'prom-client';
export type RequestErrorHandler = (params: Record<string, any>, response: AxiosResponse) => void;
export interface HTTPCommunicationConfig {
    name: string;
    axiosConfig?: AxiosRequestConfig;
    contextStorage?: AsyncLocalStorage<any>;
    errorHandler?: RequestErrorHandler;
    circuitBreakerConfig?: CircuitBreakerConfig;
}
export declare const HTTPCommunicationAxiosDefaultConfig: AxiosRequestConfig;
/**
 * RequestPayload contains body and query for the outgoing request
 */
export interface RequestPayload extends Record<string, any> {
    body?: any;
    query?: string | Record<string, string> | string[][] | URLSearchParams | undefined;
}
/**
 * CircuitBreakerConfig is the structure for the config of circuit breaker usage
 */
export interface CircuitBreakerConfig {
    options?: CircuitBreaker.Options;
    disable?: boolean;
    metricsRegistry?: Registry;
    fallbackFunction?: CircuitBreakerFallbackMethod;
}
/**
 * CircuitBreakerFallbackMethod is structure of the fallback method for errors in circuit breaker
 */
export type CircuitBreakerFallbackMethod = (request: {
    method: METHOD;
    route: string;
    request: Request;
    headers: Record<string, any>;
}, error?: Error) => void;
/**
 * HTTPCommunication wrapper
 */
export declare class HTTPCommunication {
    name: string;
    axiosClient: Axios;
    axiosConfig?: AxiosRequestConfig;
    contextStorage?: AsyncLocalStorage<any>;
    errorHandler?: RequestErrorHandler;
    metrics?: PrometheusMetrics;
    private circuitBreaker;
    /**
     * HTTPCommunication to communicate with another service
     */
    constructor({ name, axiosConfig, contextStorage, errorHandler, circuitBreakerConfig }: HTTPCommunicationConfig);
    /**
     * handleError handles all errors
     */
    private handleError;
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
     * makeRequest prepares and fires a request. It will not honour circuit breaker.
     **/
    makeRequest(params: {
        method: METHOD;
        route: string;
        request?: RequestPayload;
        headers?: Record<string, string>;
    }): Promise<any>;
    /**
     * HTTP POST Request
     */
    post<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T>;
    /**
     * HTTP PUT Request
     */
    put<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T>;
    /**
     * HTTP PATCH Request
     */
    patch<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T>;
    /**
     * HTTP DELETE Request
     */
    delete<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T>;
    /**
     * HTTP POST Request
     **/
    get<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T>;
    executeHTTPRequest(method: METHOD, route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<any>;
    static getRequestContext: typeof getRequestContext;
    static generateHexString: typeof generateHexString;
}
export { CircuitBreakerDefaultFallbackFunction, CircuitOpenError, HTTPCommunication as HttpCommunication, METHOD, generateHexString, createRequestURL, };
