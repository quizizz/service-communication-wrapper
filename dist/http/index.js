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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
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
exports.HTTPCommunicationAxiosDefaultConfig = Object.assign(Object.assign({}, Object.assign(Object.assign({}, axios_1.default.defaults), { headers: undefined })), { headers: {
        'Content-Type': 'application/json',
    }, responseType: 'json', validateStatus: (status) => {
        return status <= 504;
    } });
/**
 * HTTPCommunication wrapper
 */
class HTTPCommunication {
    /**
     * HTTPCommunication to communicate with another service
     */
    constructor({ name, axiosConfig, contextStorage, errorHandler, circuitBreakerConfig }) {
        var _a;
        this.name = name;
        // default axios config
        this.axiosConfig = exports.HTTPCommunicationAxiosDefaultConfig;
        if (axiosConfig) {
            this.axiosConfig = Object.assign(Object.assign({}, this.axiosConfig), axiosConfig);
        }
        this.axiosClient = new axios_1.Axios(this.axiosConfig);
        this.errorHandler = errorHandler;
        this.contextStorage = contextStorage;
        if (!(circuitBreakerConfig === null || circuitBreakerConfig === void 0 ? void 0 : circuitBreakerConfig.disable)) {
            this.circuitBreaker = new opossum_1.default(this.makeRequest.bind(this), Object.assign(Object.assign({}, circuit_breaker_utils_1.CircuitBreakerDefaultOverrideOptions), circuitBreakerConfig === null || circuitBreakerConfig === void 0 ? void 0 : circuitBreakerConfig.options));
            this.circuitBreaker.fallback((_a = circuitBreakerConfig === null || circuitBreakerConfig === void 0 ? void 0 : circuitBreakerConfig.fallbackFunction) !== null && _a !== void 0 ? _a : circuit_breaker_utils_1.CircuitBreakerDefaultFallbackFunction);
            if (circuitBreakerConfig === null || circuitBreakerConfig === void 0 ? void 0 : circuitBreakerConfig.metricsRegistry) {
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
    makeRequest(params) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { route, method, request, headers = {} } = params;
            const requestURL = (0, utils_1.createRequestURL)(route, request === null || request === void 0 ? void 0 : request.query);
            const requestContext = this.contextStorage ? this.contextStorage.getStore() : null;
            let finalHeaders = {};
            if (requestContext) {
                finalHeaders = Object.assign(Object.assign(Object.assign({}, (_a = this.axiosConfig) === null || _a === void 0 ? void 0 : _a.headers), this.populateHeadersFromContext(requestContext)), headers);
            }
            const req = {
                method,
                url: requestURL,
                headers: finalHeaders,
            };
            if (request === null || request === void 0 ? void 0 : request.body) {
                req['data'] = request.body;
            }
            const response = yield this.axiosClient.request(req);
            this.handleError(params, response);
            return response.data;
        });
    }
    /**
     * HTTP POST Request
     */
    post(route, request, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.executeHTTPRequest(utils_1.METHOD.POST, route, request, headers);
            return data;
        });
    }
    /**
     * HTTP PUT Request
     */
    put(route, request, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.executeHTTPRequest(utils_1.METHOD.PUT, route, request, headers);
            return data;
        });
    }
    /**
     * HTTP PATCH Request
     */
    patch(route, request, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.executeHTTPRequest(utils_1.METHOD.PATCH, route, request, headers);
            return data;
        });
    }
    /**
     * HTTP DELETE Request
     */
    delete(route, request, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.executeHTTPRequest(utils_1.METHOD.DELETE, route, request, headers);
            return data;
        });
    }
    /**
     * HTTP POST Request
     **/
    get(route, request, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.executeHTTPRequest(utils_1.METHOD.GET, route, request, headers);
            return data;
        });
    }
    executeHTTPRequest(method, route, request, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.circuitBreaker) {
                return this.circuitBreaker.fire({ method, route, request, headers });
            }
            return this.makeRequest({ method, route, request, headers });
        });
    }
}
exports.HTTPCommunication = HTTPCommunication;
exports.HttpCommunication = HTTPCommunication;
HTTPCommunication.getRequestContext = request_context_1.getRequestContext;
HTTPCommunication.generateHexString = utils_1.generateHexString;
