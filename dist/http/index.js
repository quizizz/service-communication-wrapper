"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestURL = exports.generateHexString = exports.METHOD = exports.HttpCommunication = exports.CircuitOpenError = exports.CircuitBreakerDefaultFallbackFunction = exports.HTTPCommunication = exports.HTTPCommunicationAxiosDefaultConfig = void 0;
const opossum_1 = __importDefault(require("opossum"));
const error_1 = __importDefault(require("../helpers/error"));
const axios_1 = __importStar(require("axios"));
// @ts-ignore
const opossum_prometheus_1 = __importDefault(require("opossum-prometheus"));
const utils_1 = require("../helpers/utils");
Object.defineProperty(exports, "METHOD", { enumerable: true, get: function () { return utils_1.METHOD; } });
Object.defineProperty(exports, "createRequestURL", { enumerable: true, get: function () { return utils_1.createRequestURL; } });
Object.defineProperty(exports, "generateHexString", { enumerable: true, get: function () { return utils_1.generateHexString; } });
const circuit_breaker_utils_1 = require("../helpers/circuit-breaker-utils");
Object.defineProperty(exports, "CircuitOpenError", { enumerable: true, get: function () { return circuit_breaker_utils_1.CircuitOpenError; } });
Object.defineProperty(exports, "CircuitBreakerDefaultFallbackFunction", { enumerable: true, get: function () { return circuit_breaker_utils_1.CircuitBreakerDefaultFallbackFunction; } });
const request_context_1 = require("../helpers/request-context");
exports.HTTPCommunicationAxiosDefaultConfig = {
    ...{ ...axios_1.default.defaults, headers: undefined },
    headers: {
        'Content-Type': 'application/json',
    },
    responseType: 'json', // default
    validateStatus: (status) => {
        return status <= 504;
    },
};
/**
 * HTTPCommunication wrapper
 */
class HTTPCommunication {
    name;
    axiosClient;
    axiosConfig;
    contextStorage;
    errorHandler;
    metrics;
    circuitBreaker;
    /**
     * HTTPCommunication to communicate with another service
     */
    constructor({ name, axiosConfig, contextStorage, errorHandler, circuitBreakerConfig }) {
        this.name = name;
        // default axios config
        this.axiosConfig = exports.HTTPCommunicationAxiosDefaultConfig;
        if (axiosConfig) {
            this.axiosConfig = {
                ...this.axiosConfig,
                ...axiosConfig,
            };
        }
        this.axiosClient = new axios_1.Axios(this.axiosConfig);
        this.errorHandler = errorHandler;
        this.contextStorage = contextStorage;
        if (!circuitBreakerConfig?.disable) {
            this.circuitBreaker = new opossum_1.default(this.makeRequest.bind(this), {
                ...circuit_breaker_utils_1.CircuitBreakerDefaultOverrideOptions,
                ...circuitBreakerConfig?.options,
            });
            this.circuitBreaker.fallback(circuitBreakerConfig?.fallbackFunction ?? circuit_breaker_utils_1.CircuitBreakerDefaultFallbackFunction);
            if (circuitBreakerConfig?.metricsRegistry) {
                this.metrics = new opossum_prometheus_1.default({ circuits: [this.circuitBreaker], registry: circuitBreakerConfig.metricsRegistry });
            }
        }
    }
    /**
     * handleError handles all errors
     */
    handleError(params, response) {
        if (this.errorHandler) {
            this.errorHandler(params, response);
            return;
        }
        const { method, route, request } = params;
        if (response.status >= 400) {
            if (response.data) {
                const { error, errorType = 'server.UKW' } = response.data;
                throw new error_1.default(error, errorType, {
                    service: this.name,
                    data: response.data,
                    status: response.status,
                    request,
                    method,
                    route,
                    type: errorType,
                });
            }
            throw new error_1.default('Unknown internal service error', `${this.name}_internal_service.UNKOWN_ERROR`, {
                service: this.name,
                request,
                data: response.data,
                status: response.status,
                text: response.statusText,
                method,
                route,
            });
        }
    }
    /**
     * populateHeadersFromContext takes context provided from AsyncLocalStorage, and populates relevant headers
     */
    populateHeadersFromContext(ctx) {
        const customHeaders = {
            'X-Q-TRACEID': (ctx && ctx.traceId) ? ctx.traceId : (0, utils_1.generateHexString)(32),
        };
        if (ctx) {
            if (ctx.userId)
                customHeaders['X-Q-USERID'] = ctx.userId;
            if (ctx.ab)
                customHeaders['X-Q-AB-ROUTE'] = ctx.ab;
            if (ctx.debug)
                customHeaders['X-Q-DEBUG'] = ctx.debug;
            if (ctx.requestContextToken)
                customHeaders['X-Q-REQUEST-CONTEXT-TOKEN'] = ctx.requestContextToken;
        }
        return customHeaders;
    }
    /**
     * makeRequest prepares and fires a request. It will not honour circuit breaker.
     **/
    async makeRequest(params) {
        const { route, method, request, headers = {} } = params;
        const requestURL = (0, utils_1.createRequestURL)(route, request?.query);
        const requestContext = this.contextStorage ? this.contextStorage.getStore() : null;
        let finalHeaders = {};
        if (requestContext) {
            finalHeaders = {
                ...this.axiosConfig?.headers,
                ...this.populateHeadersFromContext(requestContext),
                ...headers,
            };
        }
        const req = {
            method,
            url: requestURL,
            headers: finalHeaders,
        };
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
    async post(route, request, headers) {
        const data = await this.executeHTTPRequest(utils_1.METHOD.POST, route, request, headers);
        return data;
    }
    /**
     * HTTP PUT Request
     */
    async put(route, request, headers) {
        const data = await this.executeHTTPRequest(utils_1.METHOD.PUT, route, request, headers);
        return data;
    }
    /**
     * HTTP PATCH Request
     */
    async patch(route, request, headers) {
        const data = await this.executeHTTPRequest(utils_1.METHOD.PATCH, route, request, headers);
        return data;
    }
    /**
     * HTTP DELETE Request
     */
    async delete(route, request, headers) {
        const data = await this.executeHTTPRequest(utils_1.METHOD.DELETE, route, request, headers);
        return data;
    }
    /**
     * HTTP POST Request
     **/
    async get(route, request, headers) {
        const data = await this.executeHTTPRequest(utils_1.METHOD.GET, route, request, headers);
        return data;
    }
    async executeHTTPRequest(method, route, request, headers) {
        if (this.circuitBreaker) {
            return this.circuitBreaker.fire({ method, route, request, headers });
        }
        return this.makeRequest({ method, route, request, headers });
    }
    static getRequestContext = request_context_1.getRequestContext;
    static generateHexString = utils_1.generateHexString;
}
exports.HTTPCommunication = HTTPCommunication;
exports.HttpCommunication = HTTPCommunication;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaHR0cC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNEQUFxQztBQUNyQyw2REFBc0M7QUFDdEMsK0NBQThFO0FBRTlFLGFBQWE7QUFDYiw0RUFBbUQ7QUFDbkQsNENBQStFO0FBc1I3RSx1RkF0Uk8sY0FBTSxPQXNSUDtBQUVOLGlHQXhSZSx3QkFBZ0IsT0F3UmY7QUFEaEIsa0dBdlJpQyx5QkFBaUIsT0F1UmpDO0FBdFJuQiw0RUFBaUo7QUFtUi9JLGlHQW5STyx3Q0FBZ0IsT0FtUlA7QUFEaEIsc0hBbFJ5Qiw2REFBcUMsT0FrUnpCO0FBalJ2QyxnRUFBK0Q7QUFjbEQsUUFBQSxtQ0FBbUMsR0FBdUI7SUFDckUsR0FBRyxFQUFFLEdBQUcsZUFBVyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFO0lBQ2xELE9BQU8sRUFBRTtRQUNQLGNBQWMsRUFBRSxrQkFBa0I7S0FDbkM7SUFDRCxZQUFZLEVBQUUsTUFBTSxFQUFFLFVBQVU7SUFDaEMsY0FBYyxFQUFFLENBQUMsTUFBYyxFQUFXLEVBQUU7UUFDMUMsT0FBTyxNQUFNLElBQUksR0FBRyxDQUFDO0lBQ3ZCLENBQUM7Q0FDRixDQUFDO0FBaUNGOztHQUVHO0FBQ0gsTUFBYSxpQkFBaUI7SUFDNUIsSUFBSSxDQUFTO0lBQ2IsV0FBVyxDQUFRO0lBQ25CLFdBQVcsQ0FBc0I7SUFDakMsY0FBYyxDQUEwQjtJQUN4QyxZQUFZLENBQXVCO0lBQ25DLE9BQU8sQ0FBcUI7SUFFcEIsY0FBYyxDQUE2QjtJQUVuRDs7T0FFRztJQUNILFlBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQTJCO1FBQzVHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWpCLHVCQUF1QjtRQUN2QixJ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