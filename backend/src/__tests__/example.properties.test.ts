import * as fc from 'fast-check';

describe('Property-Based Testing Setup', () => {
  it('should verify fast-check is working with basic property', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      }),
      { numRuns: 100 }
    );
  });

  it('should verify string concatenation property', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        const result = a + b;
        return result.length === a.length + b.length;
      }),
      { numRuns: 100 }
    );
  });
});