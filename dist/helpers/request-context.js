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
    const start = node_perf_hooks_1.performance.now();
    return {
        reqStartTime: start,
        traceId: req.get('x-q-traceid') ? req.get('x-q-traceid') : (0, utils_1.generateHexString)(16),
        spanId: (0, utils_1.generateHexString)(8),
        userId: (req?.user?.id) ? String(req.user.id) : req.get('x-q-userid'),
        ab: req.get('x-q-ab-route'),
        debug: req.get('x-q-debug'),
        requestContextToken: req.get('x-q-request-context-token'),
        path: req?.route?.path,
        ...customContextValue
    };
}
exports.getRequestContext = getRequestContext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC1jb250ZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2hlbHBlcnMvcmVxdWVzdC1jb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUE0QztBQUM1QyxxREFBOEM7QUFnQzlDOzs7OztPQUtJO0FBQ0osU0FBZ0IsaUJBQWlCLENBQUksR0FBa0IsRUFBRSxrQkFBc0I7SUFDOUUsTUFBTSxLQUFLLEdBQUcsNkJBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUMvQixPQUFPO1FBQ04sWUFBWSxFQUFFLEtBQUs7UUFDbkIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUEseUJBQWlCLEVBQUMsRUFBRSxDQUFDO1FBQ2hGLE1BQU0sRUFBRSxJQUFBLHlCQUFpQixFQUFDLENBQUMsQ0FBQztRQUM1QixNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUM7UUFDckUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO1FBQzNCLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztRQUMzQixtQkFBbUIsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDO1FBQ3pELElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUk7UUFDdEIsR0FBRyxrQkFBa0I7S0FDTSxDQUFDO0FBQzlCLENBQUM7QUFiRCw4Q0FhQyJ9