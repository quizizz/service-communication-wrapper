"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class QError
 */
class QError extends Error {
    constructor(message, type = 'error', cause = null) {
        super(message);
        this.message = message;
        this.type = type;
        this.cause = cause;
        this.name = 'QuizizzError';
        this.stack = (new Error(message)).stack;
    }
}
exports.default = QError;
