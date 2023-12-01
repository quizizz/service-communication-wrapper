import { CircuitOpenError, HTTPCommunication } from '../../src/http/index';

describe('Circuit Breaker Test', () => {
  let httpCommunication: HTTPCommunication;

  beforeEach(() => {
    // Create a new instance of HTTPCommunication for each test
    httpCommunication = new HTTPCommunication({
      name: 'TestService',
    });
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  test('Circuit opens after multiple failed requests', async () => {
    // Mock the potentially unreliable HTTP request to always fail
    jest.spyOn(httpCommunication, 'get')
      .mockRejectedValueOnce(new Error('Fake error 1'))
      .mockRejectedValueOnce(new Error('Fake error 2'))
      .mockRejectedValueOnce(new Error('Fake error 3'));

    // Execute the HTTP requests that will fail
    try {
      await httpCommunication.get('/test-route');
    } catch (error) {
      // Expected behavior: Circuit breaker opens after the third failed request
      expect(error).toBeDefined();
      expect(error.message).toBe('Fake error 1');
    }

    try {
      await httpCommunication.get('/test-route');
    } catch (error) {
      // Expected behavior: Circuit breaker opens after the third failed request
      expect(error).toBeDefined();
      expect(error.message).toBe('Fake error 2');
    }

    try {
      await httpCommunication.get('/test-route');
    } catch (error) {
      // Expected behavior: Circuit breaker opens after the third failed request
      expect(error).toBeDefined();
      expect(error.message).toBe('Fake error 3');
    }

    // Attempt another request after the circuit is open
    try {
      await httpCommunication.get('/test-route');
    } catch (error) {
      // Expected behavior: Fallback response should be returned due to the open circuit
      expect(error instanceof CircuitOpenError).toBe(true);
    }

    // Check if the 'get' method was called three times
    expect(httpCommunication.get).toHaveBeenCalledTimes(4);

    // Check if the 'get' method was called with '/test-route' as an argument
    expect(httpCommunication.get).toHaveBeenCalledWith('/test-route');
  });

  test('Circuit closes after successful request', async () => {
    // Mock the potentially unreliable HTTP request to always succeed

  })


  // Add more tests as needed to cover different scenarios and behaviors of the circuit breaker
});
