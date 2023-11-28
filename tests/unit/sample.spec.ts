import { add } from '../../src/sampleTestFile';

describe('add function', () => {
  test('adds two numbers correctly', () => {
    // Arrange
    const a = 5;
    const b = 10;

    // Act
    const result = add(a, b);

    // Assert
    expect(result).toBe(15); // Expect the sum of 5 and 10 to be 15
  });

  test('adds two negative numbers correctly', () => {
    // Arrange
    const a = -8;
    const b = -3;

    // Act
    const result = add(a, b);

    // Assert
    expect(result).toBe(-11); // Expect the sum of -8 and -3 to be -11
  });
});