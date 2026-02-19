import { describe, it, expect } from 'vitest';

/**
 * Example test file to demonstrate Vitest setup
 * Following AGENTS.md requirements:
 * - Framework: Vitest (recommended)
 * - Location: /tests directory
 * - Coverage: Must meet 95% threshold
 */
describe('Example Tests', () => {
    it('should pass basic arithmetic', () => {
        expect(1 + 1).toBe(2);
        expect(2 * 2).toBe(4);
        expect(10 / 2).toBe(5);
    });

    it('should handle string operations', () => {
        const str = 'Hello, World!';
        expect(str.length).toBeGreaterThan(0);
        expect(str.toLowerCase()).toBe('hello, world!');
        expect(str.toUpperCase()).toBe('HELLO, WORLD!');
    });

    it('should work with arrays', () => {
        const arr = [1, 2, 3, 4, 5];
        expect(arr.length).toBe(5);
        expect(arr.includes(3)).toBe(true);
        expect(arr.filter(n => n > 3)).toEqual([4, 5]);
    });

    it('should handle objects', () => {
        const obj = { name: 'Test', value: 42 };
        expect(obj.name).toBe('Test');
        expect(obj.value).toBe(42);
        expect(Object.keys(obj)).toHaveLength(2);
    });
});

