import { METHOD } from "./utils";


/**
 * CircuitBreakerDefaultOverrideOptions are intentional override options for the circuit breaker.
 * Note that the library has default options set - this is an internal set of options we would like
 * to include in all our circuit breakers.
 */
export const CircuitBreakerDefaultOverrideOptions = {
	timeout: 5000, // Set a timeout for requests
	resetTimeout: 10000, // Time in milliseconds to wait before attempting to close the circuit
	errorThresholdPercentage: 90, // Percentage of failed requests before opening the circuit
	allowWarmUp: true,
}

/**
 * CircuitOpenError denotes error that the circuit is open
 */
export class CircuitOpenError extends Error {
	method?: METHOD;
	route?: string;
	request?: Request;
	headers?: Record<string, any>;

	constructor(args?: {
		method: METHOD,
		route: string;
		request: any;
		headers: Record<string, any>;
	}) {
		super('circuit open');
		this.method = args?.method;
		this.route = args?.route;
		this.request = args?.request;
		this.headers = args?.headers;
	}
}

/**
 * CircuitBreakerFallbackMethod is structure of the default fallback method for all errors
 */
export const CircuitBreakerDefaultFallbackFunction = async (req?: any, error?: Error) => {
	// This is the fallback logic you want to execute when the circuit is open or requests fail
	// For instance, return a default value or perform an alternative action
	if (error?.message === 'Breaker is open') {
		throw new CircuitOpenError(req);
	}
	throw error;
};
