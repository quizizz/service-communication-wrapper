const QError = require('../helpers/error');
const path = require('path');
const Axios =  require('axios');

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
        'X-Q-TRACEID': ctx && ctx.traceId ? ctx.traceId : uuid(),
      };
      if (ctx) {
        if (ctx.userId) headers['X-Q-USERID'] = ctx.userId;
        if (ctx.ab) headers['X-Q-AB-ROUTE'] = ctx.ab;
      }
      return customHeaders;
    }

    async makeRequest(params) {
      const { route, method, request } = params;
      const requestURL = this.createRequestURL(route, request.query);
      let response;
      const requestContext = this.contextStorage ? this.contextStorage.getStore() : null;

      if (requestContext) {
        this.axiosConfig.headers = {
          ...this.axiosConfig.headers,
          ...this.populateHeadersFromContext(requestContext),
        }
      }

      if (method === 'get') {
        response = await Axios.get(
            requestURL,
            this.axiosConfig,
        );
      } else {
        response = await Axios[method](
            requestURL,
            request.body || {},
            this.axiosConfig,
        );
      }

      this.handleError(params, response);
      return response.data;
    }

    async post(route, request) {
      const data = await this.makeRequest({
        method: 'post',
        route,
        request,
      });
      return data;
    }

    async put(route, request) {
      const data = await this.makeRequest({
        method: 'put',
        route,
        request,
      });
      return data;
    }

    async patch(route, request) {
      const data = await this.makeRequest({
        method: 'patch',
        route,
        request,
      });
      return data;
    }

    async delete(route, request) {
      const data = await this.makeRequest({
        method: 'delete',
        route,
        request,
      });
      return data;
    }

    async get(route, request = {}) {
      const data = await this.makeRequest({
        method: 'get',
        route,
        request,
      });
      return data;
    }
}

module.exports = HttpCommunication;