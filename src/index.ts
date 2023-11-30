import * as http from './http';
import { circuitBreaker, opposum } from './helpers/circuit-breaker';

export = {
    HttpCommunication: http.HTTPCommunication, // backwards compatibility
    circuitBreaker,
    opposum,
    ...http,
};
