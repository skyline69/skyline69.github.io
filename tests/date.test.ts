import { describe, expect, test } from 'bun:test';
import { fillAge, getAge } from '../src/lib/date';

describe('getAge', () => {
  test('counts birthdays that already passed this year', () => {
    expect(getAge('2005-08-02', new Date('2026-09-29'))).toBe(21);
  });

  test('does not count a birthday that is still ahead', () => {
    expect(getAge('2005-08-02', new Date('2026-08-01'))).toBe(20);
  });
});

describe('fillAge', () => {
  test('replaces every placeholder', () => {
    expect(fillAge('{age} and {age}', 21)).toBe('21 and 21');
  });
});
