import { METHOD } from "./utils";
/**
 * CircuitBreakerDefaultOverrideOptions are intentional override options for the circuit breaker.
 * Note that the library has default options set - this is an internal set of options we would like
 * to include in all our circuit breakers.
 */
export declare const CircuitBreakerDefaultOverrideOptions: {
    timeout: number;
    resetTimeout: number;
    errorThresholdPercentage: number;
    allowWarmUp: boolean;
};
/**
 * CircuitOpenError denotes error that the circuit is open
 */
export declare class CircuitOpenError extends Error {
    method?: METHOD;
    route?: string;
    request?: Request;
    headers?: Record<string, any>;
    constructor(args?: {
        method: METHOD;
        route: string;
        request: any;
        headers: Record<string, any>;
    });
}
/**
 * CircuitBreakerFallbackMethod is structure of the default fallback method for all errors
 */
export declare const CircuitBreakerDefaultFallbackFunction: (req?: any, error?: Error) => Promise<never>;
