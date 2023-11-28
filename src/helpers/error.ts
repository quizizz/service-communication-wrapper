/**
 * @class QError
 */
 class QError extends Error {
    /**
     * @param {string} message
     * @param {string} [type=error]
     * @param {Object} [cause=null] - extra data for debugging
     */
  constructor(public message: string, public type: string = 'error', public cause: any = null) {
    super(message);
    this.name = 'QuizizzError';
    this.stack = (new Error(message)).stack;
  }
}

export default QError;
