const QError = require('../helpers/error');
const path = require('path');
const Axios =  require('axios');
const uuid = require('uuid/v4');

class HttpCommunication {
    baseURL;
    name;
    axiosConfig;
    requestContext = {};

    constructor({ name, baseURL, axiosConfig }) {
      this.name = name;
      this.baseURL = baseURL;
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
    }

    handleError(params, response) {
      const { method, route, request } = params;
      if (response.status >= 400) {
        if (response.data) {
            const { error } = response.data;
            throw new QError(error, `${this.name}_internal_service.RESPONSE_ERROR`, {
              service: this.name,
              data: response.data,
              request,
              method,
              route,
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

    createRequestURL(route, query = {}) {
      const searchParams = new URLSearchParams(query);
      const finalURL = new URL(path.join(this.baseURL, route));
      finalURL.search = searchParams.toString();
      return finalURL.toString();
    }

    async makeReqeust(params) {
      const { route, method, request, requestId } = params;
      const requestURL = this.createRequestURL(route, request.query);
      let response;
      const requestContext = this.requestContext[requestId];

      if (requestContext) {
        this.axiosConfig.headers = {
          ...this.axiosConfig.headers,
          // select which headers we want to pass and pass them
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

    async post(route, request, requestId) {
      const data = await this.makeReqeust({
        method: 'post',
        route,
        request,
        requestId,
      });
      return data;
    }

    async put(route, request, requestId) {
      const data = await this.makeReqeust({
        method: 'put',
        route,
        request,
        requestId,
      });
      return data;
    }

    async get(route, request, requestId) {
      const data = await this.makeReqeust({
        method: 'get',
        route,
        request,
        requestId,
      });
      return data;
    }

    generateRequestId(ctx) {
      const requestId = uuid();
      this.requestContext[requestId] = ctx;
      return requestId;
    }
}

module.exports = HttpCommunication;