import opposum from 'opossum';

export { opposum };

export function circuitBreaker(options: opposum.Options = { timeout: 3000, errorThresholdPercentage: 50, resetTimeout: 5000 }): MethodDecorator {
  return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
      const breaker = new opposum(originalMethod.bind(this), options);
      return breaker.fire(...args).catch((error: any) => {
        console.error('Circuit Breaker Error:', error);
        throw error;
      });
    };

    return descriptor;
  };
}
