import { MockDatabase } from '../config/mockDatabase';

// Clear mock database before each test
beforeEach(() => {
  const mockDb = MockDatabase.getInstance();
  mockDb.clearAll();
});

// Set test timeout
jest.setTimeout(30000);