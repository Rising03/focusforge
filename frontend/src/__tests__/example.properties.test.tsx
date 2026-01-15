import * as fc from 'fast-check';

describe('Property-Based Testing Setup - Frontend', () => {
  it('should verify fast-check is working with basic property', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      }),
      { numRuns: 100 }
    );
  });

  it('should verify array operations property', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const reversed = [...arr].reverse();
        return reversed.reverse().join(',') === arr.join(',');
      }),
      { numRuns: 100 }
    );
  });
});