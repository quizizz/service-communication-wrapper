"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestURL = exports.generateHexString = exports.METHOD = void 0;
const crypto_1 = __importDefault(require("crypto"));
var METHOD;
(function (METHOD) {
    METHOD["POST"] = "post";
    METHOD["GET"] = "get";
    METHOD["DELETE"] = "delete";
    METHOD["PATCH"] = "patch";
    METHOD["PUT"] = "put";
})(METHOD || (exports.METHOD = METHOD = {}));
function generateHexString(size) {
    return crypto_1.default.randomBytes(size).toString("hex");
}
exports.generateHexString = generateHexString;
/**
 * createRequestURL creates a url given query parameters
 */
function createRequestURL(url, query) {
    const searchParams = new URLSearchParams(query);
    const finalURL = new URL(url);
    finalURL.search = searchParams.toString();
    return finalURL.toString();
}
exports.createRequestURL = createRequestURL;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaGVscGVycy91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxvREFBNEI7QUFFNUIsSUFBWSxNQU1YO0FBTkQsV0FBWSxNQUFNO0lBQ2pCLHVCQUFhLENBQUE7SUFDYixxQkFBVyxDQUFBO0lBQ1gsMkJBQWlCLENBQUE7SUFDakIseUJBQWUsQ0FBQTtJQUNmLHFCQUFXLENBQUE7QUFDWixDQUFDLEVBTlcsTUFBTSxzQkFBTixNQUFNLFFBTWpCO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWTtJQUM3QyxPQUFPLGdCQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBRkQsOENBRUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLGdCQUFnQixDQUFDLEdBQVcsRUFBRSxLQUFzRTtJQUNuSCxNQUFNLFlBQVksR0FBRyxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoRCxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixRQUFRLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMxQyxPQUFPLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUM1QixDQUFDO0FBTEQsNENBS0MifQ==