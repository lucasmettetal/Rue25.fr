import { describe, it, expect } from 'vitest';
import { generateRef, isValidEmail, stripHeaderChars } from '../lib/utils.js';

describe('generateRef', () => {
  it('retourne une chaîne avec le préfixe R25', () => {
    expect(generateRef()).toMatch(/^R25-\d+$/);
  });

  it('retourne des valeurs différentes à chaque appel', () => {
    const refs = new Set(Array.from({ length: 20 }, () => generateRef()));
    expect(refs.size).toBeGreaterThan(1);
  });
});

describe('isValidEmail', () => {
  it('accepte un email valide', () => {
    expect(isValidEmail('client@example.com')).toBe(true);
  });

  it('rejette une chaîne sans @', () => {
    expect(isValidEmail('pasdunemail')).toBe(false);
  });

  it('rejette une chaîne vide', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejette null et undefined', () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe('stripHeaderChars — protection injection CRLF', () => {
  it('retire un retour à la ligne \\r\\n', () => {
    const input = 'Jean Dupont\r\nBcc: attacker@evil.com';
    expect(stripHeaderChars(input)).toBe('Jean Dupont Bcc: attacker@evil.com');
  });

  it('retire un saut de ligne simple \\n', () => {
    expect(stripHeaderChars('hello\nworld')).toBe('hello world');
  });

  it('ne modifie pas une chaîne normale', () => {
    expect(stripHeaderChars('Jean Dupont')).toBe('Jean Dupont');
  });
});
