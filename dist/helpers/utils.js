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
