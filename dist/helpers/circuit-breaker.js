"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreaker = exports.opposum = void 0;
const opossum_1 = __importDefault(require("opossum"));
exports.opposum = opossum_1.default;
function circuitBreaker(options = { timeout: 3000, errorThresholdPercentage: 50, resetTimeout: 5000 }) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const breaker = new opossum_1.default(originalMethod.bind(this), options);
            return breaker.fire(...args).catch((error) => {
                console.error('Circuit Breaker Error:', error);
                throw error;
            });
        };
        return descriptor;
    };
}
exports.circuitBreaker = circuitBreaker;
