"use strict";
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
    method;
    route;
    request;
    headers;
    constructor(args) {
        super('circuit open');
        this.method = args?.method;
        this.route = args?.route;
        this.request = args?.request;
        this.headers = args?.headers;
    }
}
exports.CircuitOpenError = CircuitOpenError;
/**
 * CircuitBreakerFallbackMethod is structure of the default fallback method for all errors
 */
const CircuitBreakerDefaultFallbackFunction = async (req, error) => {
    // This is the fallback logic you want to execute when the circuit is open or requests fail
    // For instance, return a default value or perform an alternative action
    if (error?.message === 'Breaker is open') {
        throw new CircuitOpenError(req);
    }
    throw error;
};
exports.CircuitBreakerDefaultFallbackFunction = CircuitBreakerDefaultFallbackFunction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2lyY3VpdC1icmVha2VyLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2hlbHBlcnMvY2lyY3VpdC1icmVha2VyLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBOzs7O0dBSUc7QUFDVSxRQUFBLG9DQUFvQyxHQUFHO0lBQ25ELE9BQU8sRUFBRSxJQUFJLEVBQUUsNkJBQTZCO0lBQzVDLFlBQVksRUFBRSxLQUFLLEVBQUUsc0VBQXNFO0lBQzNGLHdCQUF3QixFQUFFLEVBQUUsRUFBRSwyREFBMkQ7SUFDekYsV0FBVyxFQUFFLElBQUk7Q0FDakIsQ0FBQTtBQUVEOztHQUVHO0FBQ0gsTUFBYSxnQkFBaUIsU0FBUSxLQUFLO0lBQzFDLE1BQU0sQ0FBVTtJQUNoQixLQUFLLENBQVU7SUFDZixPQUFPLENBQVc7SUFDbEIsT0FBTyxDQUF1QjtJQUU5QixZQUFZLElBS1g7UUFDQSxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQUUsTUFBTSxDQUFDO1FBQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLEtBQUssQ0FBQztRQUN6QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksRUFBRSxPQUFPLENBQUM7UUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEVBQUUsT0FBTyxDQUFDO0lBQzlCLENBQUM7Q0FDRDtBQWxCRCw0Q0FrQkM7QUFFRDs7R0FFRztBQUNJLE1BQU0scUNBQXFDLEdBQUcsS0FBSyxFQUFFLEdBQVMsRUFBRSxLQUFhLEVBQUUsRUFBRTtJQUN2RiwyRkFBMkY7SUFDM0Ysd0VBQXdFO0lBQ3hFLElBQUksS0FBSyxFQUFFLE9BQU8sS0FBSyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFDLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBQ0QsTUFBTSxLQUFLLENBQUM7QUFDYixDQUFDLENBQUM7QUFQVyxRQUFBLHFDQUFxQyx5Q0FPaEQifQ==