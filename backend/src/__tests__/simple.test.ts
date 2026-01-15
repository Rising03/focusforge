describe('Simple Backend Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle basic string operations', () => {
    const str = 'hello world';
    expect(str.toUpperCase()).toBe('HELLO WORLD');
  });
});