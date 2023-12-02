"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestContext = void 0;
const utils_1 = require("./utils");
const node_perf_hooks_1 = require("node:perf_hooks");
/**
     * Function to generate the context object
     * @param req Express request
     * @param customContextValue any custom values that you want to store in the context
     * Return extracted values from the req headers and any custom values pass to generate the context object
     */
function getRequestContext(req, customContextValue) {
    var _a, _b;
    const start = node_perf_hooks_1.performance.now();
    return Object.assign({ reqStartTime: start, traceId: req.get('x-q-traceid') ? req.get('x-q-traceid') : (0, utils_1.generateHexString)(16), spanId: (0, utils_1.generateHexString)(8), userId: ((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id) ? String(req.user.id) : req.get('x-q-userid'), ab: req.get('x-q-ab-route'), debug: req.get('x-q-debug'), requestContextToken: req.get('x-q-request-context-token'), path: (_b = req === null || req === void 0 ? void 0 : req.route) === null || _b === void 0 ? void 0 : _b.path }, customContextValue);
}
exports.getRequestContext = getRequestContext;
