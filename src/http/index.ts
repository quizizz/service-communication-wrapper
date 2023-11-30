import CircuitBreaker from 'opossum';
import QError from '../helpers/error';
import AxiosStatic, { Axios, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from 'axios';
import { performance } from 'node:perf_hooks';
import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

type RequestErrorHandler = (params: Record<string, any>, response: AxiosResponse) => void;

enum METHOD {
  POST = 'post',
  GET = 'get',
  DELETE = 'delete',
  PATCH = 'patch',
  PUT = 'put',
}

interface CircuitBreakerConfig extends CircuitBreaker.Options {
  disable?: boolean;
}

interface HTTPCommunicationConfig {
  name: string;
  axiosConfig?: AxiosRequestConfig;
  contextStorage?: AsyncLocalStorage<any>;
  errorHandler?: RequestErrorHandler;
  circuitBreakerConfig?: CircuitBreakerConfig,
}

const HTTPCommunicationAxiosDefaultConfig: AxiosRequestConfig = {
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
class HTTPCommunication {
  name: string;
  axiosClient: Axios;
  axiosConfig?: AxiosRequestConfig;
  contextStorage?: AsyncLocalStorage<any>;
  errorHandler?: RequestErrorHandler;

  private fallbackFunction = async (): Promise<string> => {
    // This is the fallback logic you want to execute when the circuit is open or requests fail
    // For instance, return a default value or perform an alternative action
    return 'Fallback response'; // You can customize this response based on your use case
  };


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
      this.circuitBreaker = new CircuitBreaker(this.makeRequest, {
        timeout: 5000, // Set a timeout for requests
        resetTimeout: 10000, // Time in milliseconds to wait before attempting to close the circuit
        errorThresholdPercentage: 50, // Percentage of failed requests before opening the circuit
        ...circuitBreakerConfig,
      });
      this.circuitBreaker.fallback(this.fallbackFunction);
    }
  }

  /**
   * Function to generate the context object
   * @param req Express request
   * @param customContextValue any custom values that you want to store in the context
   * Return extracted values from the req headers and any custom values pass to generate the context object
   */
  static getRequestContext(req: Request, customContextValue?: Record<string, unknown>): Record<string, any> {
    const start = performance.now()
    return {
      traceId: req.get('x-q-traceid') ? req.get('x-q-traceid') : HTTPCommunication.generateHexString(16),
      spanId: HTTPCommunication.generateHexString(8),
      userId: (req?.user?.id) ? String(req.user.id) : req.get('x-q-userid'),
      ab: req.get('x-q-ab-route'),
      debug: req.get('x-q-debug'),
      requestContextToken: req.get('x-q-request-context-token'),
      reqStartTime: start,
      path: req?.route?.path,
      ...customContextValue
    };
  }

  static generateHexString(size: number): string {
    return crypto.randomBytes(size).toString("hex");
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
      console.log({ error: response, params });
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
   * createRequestURL creates a url given query parameters
   */
  createRequestURL(url: string, query?: string | Record<string, string> | string[][] | URLSearchParams) {
    const searchParams = new URLSearchParams(query);
    const finalURL = new URL(url);
    finalURL.search = searchParams.toString();
    return finalURL.toString();
  }

  /**
   * populateHeadersFromContext takes context provided from AsyncLocalStorage, and populates relevant headers
   */
  populateHeadersFromContext(ctx?: { traceId?: string; userId?: string; ab?: string; debug?: boolean; requestContextToken?: string; }) {
    const customHeaders: Record<string, any> = {
      'X-Q-TRACEID': (ctx && ctx.traceId) ? ctx.traceId : HTTPCommunication.generateHexString(32),
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
   * makeRequest prepares and fires a request
   **/
  private async makeRequest(params: {
    method: METHOD,
    route: string,
    request?: HTTPRequest,
    headers?: AxiosRequestHeaders,
  }) {
    const { route, method, request, headers = {} } = params;
    const requestURL = this.createRequestURL(route, request?.query);
    const requestContext = this.contextStorage ? this.contextStorage.getStore() : null;
    let finalHeaders = {};

    if (requestContext) {
      finalHeaders = {
        ...this.axiosConfig?.headers,
        ...this.populateHeadersFromContext(requestContext),
        ...headers,
      };
    }

    const req: { method: string; url: string; headers: Record<string, string>; data?: any } = {
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
  async post(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders) {
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
  async put(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders) {
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
  async patch(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders) {
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
  async delete(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders) {
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
  async get(route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders) {
    const data = await this.executeHTTPRequest(
      METHOD.GET,
      route,
      request,
      headers,
    );
    return data;
  }

  async executeHTTPRequest(method: METHOD, route: string, request?: HTTPRequest, headers?: AxiosRequestHeaders): Promise<any> {
    if (this.circuitBreaker) {
      return this.circuitBreaker.fire({ method, route, request, headers });
    }
    return this.makeRequest({ method, route, request, headers });
  }
}

export {
  HTTPRequest,
  RequestErrorHandler,
  CircuitBreakerConfig,
  HTTPCommunicationConfig,
  METHOD,
  HTTPCommunicationAxiosDefaultConfig,
  Request,
  HTTPCommunication,
  HTTPCommunication as HttpCommunication,
};
