const QError = require('../helpers/error');
const path = require('path');
const Axios =  require('axios');
const { performance } = require('perf_hooks');
const crypto = require('crypto');

class HttpCommunication {
    name;
    axiosConfig;
    contextStorage;

    constructor({ name, axiosConfig, contextStorage }) {
      this.name = name;
      // default axios config
      this.axiosConfig = {
        headers: {
            'Content-Type': 'application/json',
        },
        responseType: 'json', // default
        validateStatus: function (status) {
            return status <= 504;
        },
      };
      if (axiosConfig) {
        this.axiosConfig = axiosConfig;
      }

      this.contextStorage = contextStorage;
    }

    static getRequestContext(req, customContextValue) {
      const start = performance.now()
      return {
        traceId: req.get('x-q-traceid') ? req.get('x-q-traceid') : this.generateHexString(16),
        spanId: this.generateHexString(8),
        userId: (req.user && req.user.id)
          ? String(req.user.id)
          : req.get('x-q-userid'),
        ab: req.get('x-q-ab-route'),
        debug: req.get('x-q-debug'),
        requestContextToken: req.get('x-q-request-context-token'),
        reqStartTime: start,
        path: req?.route.path,
        ...customContextValue
      };
    }

    static generateHexString(size) {
      return crypto.randomBytes(size).toString("hex");
    }

    handleError(params, response) {
      const { method, route, request } = params;
      if (response.status >= 400) {
        if (response.data) {
          const { error, errorType = 'server.UKW' } = response.data;
          throw new QError(error, errorType, {
              service: this.name,
              data: response.data,
              request,
              method,
              route,
              type: errorType,
            }
          );
        }
        throw new QError('Unknown internal service error', `${this.name}_internal_service.UNKOWN_ERROR`, {
              service: this.name,
              request,
              data: response.data,
              status: response.status,
              text: response.statusText,
              method,
              route,
            }
        );
      }
    }

    createRequestURL(url, query = {}) {
      const searchParams = new URLSearchParams(query);
      const finalURL = new URL(url);
      finalURL.search = searchParams.toString();
      return finalURL.toString();
    }

    populateHeadersFromContext(ctx) {
      const customHeaders = {
        'X-Q-TRACEID': (ctx && ctx.traceId) ? ctx.traceId : HttpCommunication.generateHexString(32),
      };
      if (ctx) {
        if (ctx.userId) customHeaders['X-Q-USERID'] = ctx.userId;
        if (ctx.ab) customHeaders['X-Q-AB-ROUTE'] = ctx.ab;
        if (ctx.debug) customHeaders['X-Q-DEBUG'] = ctx.debug;
        if (ctx.requestContextToken) customHeaders['X-Q-REQUEST-CONTEXT-TOKEN'] = ctx.requestContextToken;
      }
      return customHeaders;
    }

    async makeRequest(params) {
      const { route, method, request, headers = {} } = params;
      const requestURL = this.createRequestURL(route, request.query);
      let response;
      const requestContext = this.contextStorage ? this.contextStorage.getStore() : null;
      let finalHeaders = {};

      if (requestContext) {
        finalHeaders = {
          ...this.axiosConfig.headers,
          ...this.populateHeadersFromContext(requestContext),
          ...headers,
        };
      }

      const axiosConfig = {
        ...this.axiosConfig,
        headers: finalHeaders,
      };

      const req = {
        method,
        url: requestURL,
        ...axiosConfig,
      }
      if (request.body) {
        req['data'] = request.body;
      }
      response = await Axios(req);

      this.handleError(params, response);
      return response.data;
    }

    async post(route, request, headers = {}) {
      const data = await this.makeRequest({
        method: 'post',
        route,
        request,
        headers,
      });
      return data;
    }

    async put(route, request, headers = {}) {
      const data = await this.makeRequest({
        method: 'put',
        route,
        request,
        headers,
      });
      return data;
    }

    async patch(route, request, headers = {}) {
      const data = await this.makeRequest({
        method: 'patch',
        route,
        request,
        headers,
      });
      return data;
    }

    async delete(route, request, headers = {}) {
      const data = await this.makeRequest({
        method: 'delete',
        route,
        request,
        headers,
      });
      return data;
    }

    async get(route, request = {}, headers = {}) {
      const data = await this.makeRequest({
        method: 'get',
        route,
        request,
        headers,
      });
      return data;
    }
}

module.exports = HttpCommunication;