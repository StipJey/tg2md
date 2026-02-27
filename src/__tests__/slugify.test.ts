import { describe, it, expect } from 'vitest';
import { slugify } from '../slugify.js';

describe('slugify', () => {
    it('transliterates cyrillic text', () => {
        expect(slugify('Привет мир')).toBe('privet-mir');
    });

    it('lowercases latin text and replaces spaces', () => {
        expect(slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
        expect(slugify('TypeScript: type vs interface!')).toBe('typescript-type-vs-interface');
    });

    it('transliterates ё', () => {
        expect(slugify('Ёжик в тумане')).toBe('yozhik-v-tumane');
    });

    it('truncates to 80 characters', () => {
        const longText = 'а'.repeat(100);
        const result = slugify(longText);
        expect(result.length).toBeLessThanOrEqual(80);
    });

    it('returns empty string for empty input', () => {
        expect(slugify('')).toBe('');
    });

    it('returns empty string for only special characters', () => {
        expect(slugify('!!!???')).toBe('');
    });

    it('handles mixed cyrillic and latin', () => {
        expect(slugify('React 18: что нового')).toBe('react-18-chto-novogo');
    });

    it('strips leading and trailing hyphens', () => {
        expect(slugify('  --hello--  ')).toBe('hello');
    });

    it('collapses consecutive hyphens', () => {
        expect(slugify('hello   world')).toBe('hello-world');
    });
});
