/**
 * @class QError
 */
export default class QError extends Error {
    message: string;
    type: string;
    cause: any;
    constructor(message: string, type?: string, cause?: any);
}
