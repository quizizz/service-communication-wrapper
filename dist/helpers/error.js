"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class QError
 */
class QError extends Error {
    message;
    type;
    cause;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaGVscGVycy9lcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOztHQUVHO0FBQ0gsTUFBcUIsTUFBTyxTQUFRLEtBQUs7SUFDdkMsT0FBTyxDQUFTO0lBQ2hCLElBQUksQ0FBUztJQUNiLEtBQUssQ0FBTTtJQUVYLFlBQVksT0FBZSxFQUFFLE9BQWUsT0FBTyxFQUFFLFFBQWEsSUFBSTtRQUNwRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQztRQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBYkQseUJBYUMifQ==