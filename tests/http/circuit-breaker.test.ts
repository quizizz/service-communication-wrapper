import { CircuitOpenError, HTTPCommunication } from '../../src/http/index';
const makeURL = (route: string) => `http://localhost:8000${route}`;

jest.mock('axios');

describe('Circuit Breaker Test', () => {
  // Create a new instance of HTTPCommunication for each test
  const httpCommunication = new HTTPCommunication({
    name: 'TestService',
    circuitBreakerConfig: {
      disable: false,
      options: {
        resetTimeout: 1_000,
      }
    }
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  let numberOfRequests = 0;
  let failStart: number;

  test('First request should pass', async () => {
    // first successful request
    httpCommunication.axiosClient.request = jest.fn(async () => {
      return { success: true, data: { ok: true, count: numberOfRequests++ } };
    });
    await httpCommunication.get(makeURL('/test-route'));
  })

  test('Circuit opens after threshold of failed requests is breached', async () => {
    // failure counter tracks number of errors
    httpCommunication.axiosClient.request = jest.fn(async () => {
      throw new Error(`Fake error ${numberOfRequests++}`);
    });
    while (numberOfRequests <= 10) {
      try {
        await httpCommunication.get(makeURL('/test-route'));
        fail('should not succeed');
      } catch (error) {
        failStart = Date.now();
        // Expected behavior: Circuit breaker opens after the third failed request
        expect(error).toBeDefined();
        expect(error.message).toBe(`Fake error ${numberOfRequests - 1}`);
      }
    }
    // Circuit opens after 80% failure
    try {
      await httpCommunication.get(makeURL('/test-route'));
      fail('should not succeed');
    } catch (error) {
      // Expected behavior: Fallback response should be returned due to the open circuit
      expect(error).toBeInstanceOf(CircuitOpenError);
    }
  });

  test('Circuit half opens after reset timeout', async () => {
    await new Promise(res => {
      setTimeout(res, 1_000 - (Date.now() - failStart) + 100);
    });
    // half open state
    httpCommunication.axiosClient.request = jest.fn(async () => {
      return { success: true, data: { ok: true, count: numberOfRequests++ } };
    });
    const result = await httpCommunication.get(makeURL('/test-route'));
    expect(result).toBeDefined();
  });
});

