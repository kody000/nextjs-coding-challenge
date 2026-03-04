import { describe, it, expect } from 'vitest';
import { calculateWPM, calculateAccuracy, compareText } from '../lib/game-utils';

describe('calculateWPM', () => {
  it('calculates WPM correctly for 60 seconds', () => {
    const wpm = calculateWPM(300, 60000);
    expect(wpm).toBe(60);
  });

  it('calculates WPM correctly for 30 seconds', () => {
    const wpm = calculateWPM(150, 30000);
    expect(wpm).toBe(60);
  });

  it('returns 0 for 0 elapsed time', () => {
    const wpm = calculateWPM(300, 0);
    expect(wpm).toBe(0);
  });

  it('returns 0 for negative elapsed time', () => {
    const wpm = calculateWPM(300, -1000);
    expect(wpm).toBe(0);
  });

  it('handles small time periods', () => {
    const wpm = calculateWPM(25, 5000);
    expect(wpm).toBe(60);
  });
});

describe('calculateAccuracy', () => {
  it('calculates 100% accuracy', () => {
    const accuracy = calculateAccuracy(100, 100);
    expect(accuracy).toBe(1);
  });

  it('calculates 50% accuracy', () => {
    const accuracy = calculateAccuracy(50, 100);
    expect(accuracy).toBe(0.5);
  });

  it('calculates 0% accuracy', () => {
    const accuracy = calculateAccuracy(0, 100);
    expect(accuracy).toBe(0);
  });

  it('returns 0 for 0 total chars', () => {
    const accuracy = calculateAccuracy(0, 0);
    expect(accuracy).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const accuracy = calculateAccuracy(33, 100);
    expect(accuracy).toBe(0.33);
  });
});

describe('compareText', () => {
  it('returns correct count when text matches', () => {
    const result = compareText('hello', 'hello');
    expect(result.correctChars).toBe(5);
    expect(result.totalChars).toBe(5);
  });

  it('returns 0 correct when text is completely wrong', () => {
    const result = compareText('abcde', 'fghij');
    expect(result.correctChars).toBe(0);
    expect(result.totalChars).toBe(5);
  });

  it('returns partial correct for mixed results', () => {
    const result = compareText('hello', 'hxllo');
    expect(result.correctChars).toBe(4);
    expect(result.totalChars).toBe(5);
  });

  it('handles empty input', () => {
    const result = compareText('', 'hello');
    expect(result.correctChars).toBe(0);
    expect(result.totalChars).toBe(0);
  });

  it('handles input longer than target', () => {
    const result = compareText('hello world', 'hello');
    expect(result.correctChars).toBe(5);
    expect(result.totalChars).toBe(11);
  });
});
