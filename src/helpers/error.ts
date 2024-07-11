/**
 * @class QError
 */
export default class QError extends Error {
  message: string;
  type: string;
  cause: any;

  constructor(message: string, type: string = 'error', cause: any = null) {
    super(message);
    this.message = message;
    this.type = type;
    this.cause = cause;
    this.name = 'QuizizzError';
    this.stack = (new Error(message)).stack;
  }
}
