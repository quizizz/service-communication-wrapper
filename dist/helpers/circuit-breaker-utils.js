"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerDefaultFallbackFunction = exports.CircuitOpenError = exports.CircuitBreakerDefaultOverrideOptions = void 0;
/**
 * CircuitBreakerDefaultOverrideOptions are intentional override options for the circuit breaker.
 * Note that the library has default options set - this is an internal set of options we would like
 * to include in all our circuit breakers.
 */
exports.CircuitBreakerDefaultOverrideOptions = {
    timeout: 5000, // Set a timeout for requests
    resetTimeout: 10000, // Time in milliseconds to wait before attempting to close the circuit
    errorThresholdPercentage: 90, // Percentage of failed requests before opening the circuit
    allowWarmUp: true,
};
/**
 * CircuitOpenError denotes error that the circuit is open
 */
class CircuitOpenError extends Error {
    constructor(args) {
        super('circuit open');
        this.method = args === null || args === void 0 ? void 0 : args.method;
        this.route = args === null || args === void 0 ? void 0 : args.route;
        this.request = args === null || args === void 0 ? void 0 : args.request;
        this.headers = args === null || args === void 0 ? void 0 : args.headers;
    }
}
exports.CircuitOpenError = CircuitOpenError;
/**
 * CircuitBreakerFallbackMethod is structure of the default fallback method for all errors
 */
const CircuitBreakerDefaultFallbackFunction = (req, error) => __awaiter(void 0, void 0, void 0, function* () {
    // This is the fallback logic you want to execute when the circuit is open or requests fail
    // For instance, return a default value or perform an alternative action
    if ((error === null || error === void 0 ? void 0 : error.message) === 'Breaker is open') {
        throw new CircuitOpenError(req);
    }
    throw error;
});
exports.CircuitBreakerDefaultFallbackFunction = CircuitBreakerDefaultFallbackFunction;
