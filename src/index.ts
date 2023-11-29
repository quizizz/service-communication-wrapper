import HTTPCommunication from './http';
import { circuitBreaker, opposum } from './helpers/circuit-breaker';

export default {
    HttpCommunication: HTTPCommunication, // backwards compatibility
    HTTPCommunication,
    circuitBreaker,
    opposum,
};
