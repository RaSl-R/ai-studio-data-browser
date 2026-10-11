import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, getPasswordStrength, validateWhereClause } from '../utils';
import { isValidIdentifier, escapeIdentifier, signJWT, verifyJWT } from '../../worker/index';

describe('Frontend Utils', () => {
  it('validates emails correctly', () => {
    expect(validateEmail('test@example.com').isValid).toBe(true);
    expect(validateEmail('invalid-email').isValid).toBe(false);
    expect(validateEmail('').isValid).toBe(false);
  });

  it('validates passwords correctly', () => {
    expect(validatePassword('Password123!').isValid).toBe(true);
    expect(validatePassword('short').isValid).toBe(false);
    expect(validatePassword('').isValid).toBe(false);
  });

  it('calculates password strength accurately', () => {
    expect(getPasswordStrength('weak').score).toBeLessThan(2);
    expect(getPasswordStrength('Medium123').label).toBe('Medium');
    expect(getPasswordStrength('StrongP@ssw0rd!').label).toBe('Strong');
  });

  it('prevents unsafe SQL where clauses', () => {
    expect(validateWhereClause("status = 'active'").isValid).toBe(true);
    expect(validateWhereClause("1=1; DROP TABLE users;").isValid).toBe(false);
    expect(validateWhereClause("status = 'active' -- comment").isValid).toBe(false);
    expect(validateWhereClause("id = 1 DELETE FROM users").isValid).toBe(false);
  });
});

describe('Worker Security & JWT Utilities', () => {
  it('validates SQL identifiers', () => {
    expect(isValidIdentifier('public')).toBe(true);
    expect(isValidIdentifier('users_table_1')).toBe(true);
    expect(isValidIdentifier('schema"; DROP TABLE users;--')).toBe(false);
    expect(isValidIdentifier('table name with spaces')).toBe(false);
  });

  it('escapes valid identifiers safely', () => {
    expect(escapeIdentifier('users')).toBe('"users"');
    expect(() => escapeIdentifier('users;--')).toThrow();
  });

  it('signs and verifies JWT tokens correctly', async () => {
    const secret = 'test-jwt-secret';
    const payload = { id: 42, email: 'user@example.com', group_id: 1 };

    const token = await signJWT(payload, secret);
    expect(typeof token).toBe('string');

    const decoded = await verifyJWT(token, secret);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(42);
    expect(decoded?.email).toBe('user@example.com');

    // Invalid secret verification
    const invalidDecoded = await verifyJWT(token, 'wrong-secret');
    expect(invalidDecoded).toBeNull();
  });
});
