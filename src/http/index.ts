import CircuitBreaker from 'opossum';
import QError from '../helpers/error';
import AxiosStatic, { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AsyncLocalStorage } from 'node:async_hooks';
// @ts-ignore
import PrometheusMetrics from 'opossum-prometheus';
import { METHOD, createRequestURL, generateHexString } from '../helpers/utils';
import { CircuitOpenError, CircuitBreakerDefaultFallbackFunction, CircuitBreakerDefaultOverrideOptions } from '../helpers/circuit-breaker-utils';
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

export const HTTPCommunicationAxiosDefaultConfig: AxiosRequestConfig = {
  ...{ ...AxiosStatic.defaults, headers: undefined },
  headers: {
    'Content-Type': 'application/json',
  },
  responseType: 'json', // default
  validateStatus: (status: number): boolean => {
    return status <= 504;
  },
};


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
},
  error?: Error) => void;


/**
 * HTTPCommunication wrapper
 */
export class HTTPCommunication {
  name: string;
  axiosClient: Axios;
  axiosConfig?: AxiosRequestConfig;
  contextStorage?: AsyncLocalStorage<any>;
  errorHandler?: RequestErrorHandler;
  metrics?: PrometheusMetrics;

  private circuitBreaker: CircuitBreaker | undefined;

  /**
   * HTTPCommunication to communicate with another service
   */
  constructor({ name, axiosConfig, contextStorage, errorHandler, circuitBreakerConfig }: HTTPCommunicationConfig) {
    this.name = name;

    // default axios config
    this.axiosConfig = HTTPCommunicationAxiosDefaultConfig;
    if (axiosConfig) {
      this.axiosConfig = {
        ...this.axiosConfig,
        ...axiosConfig,
      };
    }

    this.axiosClient = new Axios(this.axiosConfig);

    this.errorHandler = errorHandler;
    this.contextStorage = contextStorage;



    if (!circuitBreakerConfig?.disable) {
      this.circuitBreaker = new CircuitBreaker(this.makeRequest.bind(this), {
        ...CircuitBreakerDefaultOverrideOptions,
        ...circuitBreakerConfig?.options,
      });

      this.circuitBreaker.fallback(circuitBreakerConfig?.fallbackFunction ?? CircuitBreakerDefaultFallbackFunction);
      if (circuitBreakerConfig?.metricsRegistry) {
        this.metrics = new PrometheusMetrics({ circuits: [this.circuitBreaker], registry: circuitBreakerConfig.metricsRegistry });
      }
    }
  }

  /**
   * handleError handles all errors
   */
  private handleError(params: Record<string, any>, response: AxiosResponse) {
    if (this.errorHandler) {
      this.errorHandler(params, response);
      return;
    }

    const { method, route, request } = params;
    if (response.status >= 400) {
      if (response.data) {
        const { error, errorType = 'server.UKW' } = response.data;
        throw new QError(error, errorType, {
          service: this.name,
          data: response.data,
          status: response.status,
          request,
          method,
          route,
          type: errorType,
        }
        );
      }
      throw new QError('Unknown internal service error', `${this.name}_internal_service.UNKOWN_ERROR`, {
        service: this.name,
        request,
        data: response.data,
        status: response.status,
        text: response.statusText,
        method,
        route,
      }
      );
    }
  }

  /**
   * populateHeadersFromContext takes context provided from AsyncLocalStorage, and populates relevant headers
   */
  populateHeadersFromContext(ctx?: { traceId?: string; userId?: string; ab?: string; debug?: boolean; requestContextToken?: string; }) {
    const customHeaders: Record<string, any> = {
      'X-Q-TRACEID': (ctx && ctx.traceId) ? ctx.traceId : generateHexString(32),
    };
    if (ctx) {
      if (ctx.userId) customHeaders['X-Q-USERID'] = ctx.userId;
      if (ctx.ab) customHeaders['X-Q-AB-ROUTE'] = ctx.ab;
      if (ctx.debug) customHeaders['X-Q-DEBUG'] = ctx.debug;
      if (ctx.requestContextToken) customHeaders['X-Q-REQUEST-CONTEXT-TOKEN'] = ctx.requestContextToken;
    }
    return customHeaders;
  }


  /**
   * makeRequest prepares and fires a request. It will not honour circuit breaker.
   **/
  async makeRequest(params: {
    method: METHOD,
    route: string,
    request?: RequestPayload,
    headers?: Record<string, string>,
  }) {
    const { route, method, request, headers = {} } = params;
    const requestURL = createRequestURL(route, request?.query);
    const requestContext = this.contextStorage ? this.contextStorage.getStore() : null;
    let finalHeaders = {};

    if (requestContext) {
      finalHeaders = {
        ...this.axiosConfig?.headers,
        ...this.populateHeadersFromContext(requestContext),
        ...headers,
      };
    }

    const req: AxiosRequestConfig = {
      method,
      url: requestURL,
      headers: finalHeaders,
    }
    if (request?.body) {
      req['data'] = request.body;
    }

    const response = await this.axiosClient.request(req);
    this.handleError(params, response);
    return response.data;
  }


  /**
   * HTTP POST Request
   */
  async post<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T> {
    const data = await this.executeHTTPRequest(
      METHOD.POST,
      route,
      request,
      headers,
    );
    return data;
  }

  /**
   * HTTP PUT Request
   */
  async put<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T> {
    const data = await this.executeHTTPRequest(
      METHOD.PUT,
      route,
      request,
      headers,
    );
    return data;
  }


  /**
   * HTTP PATCH Request
   */
  async patch<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T> {
    const data = await this.executeHTTPRequest(
      METHOD.PATCH,
      route,
      request,
      headers,
    );
    return data;
  }

  /**
   * HTTP DELETE Request
   */
  async delete<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T> {
    const data = await this.executeHTTPRequest(
      METHOD.DELETE,
      route,
      request,
      headers,
    );
    return data;
  }

  /**
   * HTTP POST Request
   **/
  async get<T>(route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<T> {
    const data = await this.executeHTTPRequest(
      METHOD.GET,
      route,
      request,
      headers,
    );
    return data;
  }

  async executeHTTPRequest(method: METHOD, route: string, request?: RequestPayload, headers?: Record<string, string>): Promise<any> {
    if (this.circuitBreaker) {
      return this.circuitBreaker.fire({ method, route, request, headers });
    }
    return this.makeRequest({ method, route, request, headers });
  }

  static getRequestContext = getRequestContext;
  static generateHexString = generateHexString;
}

export {
  CircuitBreakerDefaultFallbackFunction,
  CircuitOpenError,
  HTTPCommunication as HttpCommunication,
  METHOD,
  generateHexString,
  createRequestURL,
};
