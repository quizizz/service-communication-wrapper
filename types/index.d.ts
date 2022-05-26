import { AxiosRequestConfig } from 'axios';

export class HttpCommunication {
    /**
     * HttpCommunication to communicate with another service
     * @param name
     * @param baseURL
     * @param axiosConfig
     */
    constructor({ name, baseURL, axiosConfig } : { name: string, baseURL: string, axiosConfig?: AxiosRequestConfig });

    /**
     * Http Get Request
     * @param route 
     * @param request 
     * @typeParam T - Response type provided by the callee
     * @returns Returns response of the get request
     */
    get<T>(route: string, request: { query: Record<string, string> }): Promise<T>;

    /**
     * Http Put Request
     * @param route 
     * @param request 
     * @typeParam T - Response type provided by the callee
     * @returns Returns response of the put request
     */
    put<T>(route: string, request: { query: Record<string, string>, body: Record<string, unknown> }): Promise<T>;

    /**
     * Http Post Request
     * @param route 
     * @param request 
     * @typeParam T - Response type provided by the callee
     * @returns Returns response of the post request
     */
    post<T>(route: string, request: { query: Record<string, string>, body: Record<string, unknown> }): Promise<T>;
}