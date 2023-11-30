/** @type {import('@types/jest')} */

import { HTTPCommunication, HTTPCommunicationAxiosDefaultConfig, METHOD } from '../../src/';

import Axios from 'axios';
import QError from '../../src/helpers/error.ts';

jest.mock('axios');

class MockContextStorage {
	store: Record<string, any>;

	structor() {
		this.store = {};
	}

	set(key: string, value: any) {
		this.store[key] = value;
	}

	get(key: string) {
		return this.store[key];
	}


	getStore() {
		return this.store;
	}

	run(fn: () => any) {
		return fn();
	}
}

describe('HttpCommunication', () => {
	let httpComm: HTTPCommunication;
	let mockContextStorage;

	beforeEach(() => {
		mockContextStorage = new MockContextStorage();
		httpComm = new HTTPCommunication({
			name: 'TestService',
			contextStorage: mockContextStorage,
			circuitBreakerConfig: {
				disable: true,
			}
		});

		Axios.mockClear();
	});

	describe('Constructor', () => {
		it('should initialize with default values', () => {
			expect(httpComm.name).toBe('TestService');
			expect(httpComm.axiosConfig).toEqual(HTTPCommunicationAxiosDefaultConfig);
			expect(httpComm.contextStorage).toBe(mockContextStorage);
		});

		it('should override axios config if provided', () => {
			const customConfig = {
				name: 'Service',
				axiosConfig: {
					headers: {
						'Content-Type': 'application/xml',
					},
				},
			};
			const customHttpComm = new HTTPCommunication(customConfig);
			expect(customHttpComm.axiosConfig).toEqual({
				...HTTPCommunicationAxiosDefaultConfig,
				...customConfig.axiosConfig,
			});
		});
	});

	describe('getRequestContext', () => {
		it('should generate a request context from the request', () => {
			const req = {
				get: jest.fn(header => {
					if (header === 'x-q-traceid') return 'test-trace-id';
					if (header === 'x-q-userid') return 'test-user-id';
					if (header === 'x-q-ab-route') return 'test-ab-route';
					if (header === 'x-q-debug') return 'test-debug';
					if (header === 'x-q-request-context-token') return 'test-req-ctx';
				}),
				user: { id: '123' },
				route: { path: '/test' },
			};

			const context = HTTPCommunication.getRequestContext(req);
			expect(context.traceId).toBe('test-trace-id');
			expect(context.userId).toBe('123');
			expect(context.path).toBe('/test');
			expect(context.ab).toBe('test-ab-route');
			expect(context.debug).toBe('test-debug');
			expect(context.requestContextToken).toBe('test-req-ctx');
		});

		//This test is part of RCA Action Item - https://app.asana.com/0/1203506459903927/1205603105620606
		it('should generate a request context even if route field is empty', () => {

			//Creating a request which does not have route field
			const req = {
				get: jest.fn(header => {
					if (header === 'x-q-traceid') return 'test-trace-id-1';
					if (header === 'x-q-userid') return 'test-user-id-1';
					if (header === 'x-q-ab-route') return 'test-ab-route-1';
					if (header === 'x-q-debug') return 'test-debug-1';
					if (header === 'x-q-request-context-token') return 'test-req-ctx-1';
				}),
				user: { id: '321' },
			};

			const context = HTTPCommunication.getRequestContext(req);

			expect(context.traceId).toBe('test-trace-id-1');
			expect(context.userId).toBe('321');
			expect(context.ab).toBe('test-ab-route-1');
			expect(context.debug).toBe('test-debug-1');
			expect(context.requestContextToken).toBe('test-req-ctx-1');
		});
	});

	describe('generateHexString', () => {
		it('should generate a hex string of the specified size', () => {
			const size = 16;
			const hexString = HTTPCommunication.generateHexString(size);
			expect(hexString).toMatch(/^[0-9a-f]+$/);
			expect(hexString.length).toBe(size * 2); // Each byte is represented by two hex characters
		});
	});

	describe('handleError', () => {
		const params = {
			method: 'GET',
			route: '/test',
			request: {
				id: '123'
			},
		};

		it('should throw QError if response status is >= 400', () => {
			const response = {
				status: 400,
				data: {
					error: 'Bad Request',
					errorType: 'client.BAD_REQUEST',
				},
			};

			try {
				httpComm.handleError(params, response);
				fail('handleError did not throw an error');
			} catch (err) {

				expect(err).toBeInstanceOf(QError);
				expect(err.message).toBe('Bad Request');
				expect(err.type).toBe('client.BAD_REQUEST');
				expect(err.cause.service).toBe('TestService');
				expect(err.cause.method).toBe('GET');
				expect(err.cause.route).toBe('/test');
				expect(err.cause.request.id).toBe('123');
			}
		});

		it('should throw QError with default errorType if not provided', () => {
			const response = {
				status: 500,
				data: {
					error: 'Internal Server Error',
				},
			};

			try {
				httpComm.handleError(params, response);
				fail('handleError did not throw an error');
			} catch (err: any) {
				expect(err).toBeInstanceOf(QError);
				expect(err.message).toBe('Internal Server Error');
				expect(err.type).toBe('server.UKW');
				expect(err.cause.service).toBe('TestService');
				expect(err.cause.method).toBe('GET');
				expect(err.cause.route).toBe('/test');
				expect(err.cause.request.id).toBe('123');
			}
		});

		it('should throw QError with default message and errorType if response data is not provided', () => {
			const response = {
				status: 500,
				statusText: 'Internal Server Error',
			};

			try {
				httpComm.handleError(params, response);
				fail('handleError did not throw an error');
			} catch (err) {
				expect(err).toBeInstanceOf(QError);
				expect(err.message).toBe('Unknown internal service error');
				expect(err.type).toBe('TestService_internal_service.UNKOWN_ERROR');
				expect(err.cause.service).toBe('TestService');
				expect(err.cause.method).toBe('GET');
				expect(err.cause.route).toBe('/test');
				expect(err.cause.request.id).toBe('123');
			}
		});
	});

	describe('createRequestURL', () => {
		it('should create a URL with query parameters', () => {
			const url = 'http://localhost/test';
			const query = { param1: 'value1', param2: 'value2' };
			const result = httpComm.createRequestURL(url, query);
			expect(result).toBe('http://localhost/test?param1=value1&param2=value2');
		});
	});

	describe('populateHeadersFromContext', () => {
		it('should populate headers from the context', () => {
			const context = {
				traceId: 'test-trace-id',
				userId: 'test-user-id',
				ab: 'test-ab',
				debug: 'test-debug',
				requestContextToken: 'test-token',
			};

			const headers = httpComm.populateHeadersFromContext(context);
			expect(headers).toEqual({
				'X-Q-TRACEID': 'test-trace-id',
				'X-Q-USERID': 'test-user-id',
				'X-Q-AB-ROUTE': 'test-ab',
				'X-Q-DEBUG': 'test-debug',
				'X-Q-REQUEST-CONTEXT-TOKEN': 'test-token',
			});
		});

		it('should generate a traceId if not provided in the context', () => {
			const context = {};
			const headers = httpComm.populateHeadersFromContext(context);
			expect(headers['X-Q-TRACEID']).toMatch(/^[0-9a-f]+$/);
			expect(headers['X-Q-TRACEID'].length).toBe(32 * 2); // Each byte is represented by two hex characters
		});
	});

	describe('makeRequest', () => {
		it('should make a GET request and return data', async () => {
			const responseData = { key: 'value' };
			const route = 'https://test-site/test/get_with_data';

			httpComm.axiosClient.request = jest.fn(async ({ method, url }) => {
				if (method === METHOD.GET && url === route) {
					return {
						status: 200,
						data: responseData,
					};
				}
			});


			const params = {
				method: 'get',
				route,
				request: {},
			};

			const data = await httpComm.makeRequest(params);

			expect(data).toEqual(responseData);
		});

		it('should handle errors correctly', async () => {
			const route = 'https://test-site/test/get_with_error';

			httpComm.axiosClient.request = jest.fn(async ({ method, url }) => {
				if (method === METHOD.GET && url === route) {
					return {
						status: 400,
						data: {
							error: 'Bad Request',
							errorType: 'client.BAD_REQUEST',
						},
					};
				}
			});

			const params = {
				method: 'get',
				route: 'https://test-site/test/get_with_error',
				request: {},
			};

			await expect(httpComm.makeRequest(params)).rejects.toThrow(QError);
		});
	});

	describe('HTTP Method Wrappers', () => {
		const responseData = { key: 'value' };

		// All other methods are reusing the makeRequest method hence not adding tests for them separately
		it('should make a POST request', async () => {
			const route = 'https://test-site/test/post_with_response';
			httpComm.axiosClient.request = jest.fn(async ({ method, url }) => {
				if (method === METHOD.POST && url === route) {
					return {
						status: 200,
						data: responseData,
					};
				}
			});
			const data = await httpComm.post(route, { payload: 'payload' });
			expect(data).toEqual(responseData);
		});
	})
});