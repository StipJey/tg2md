import { describe, it, expect } from 'vitest';
import {
    convertEntities,
    formatAstroDate,
    escapeYaml,
    getPhotoImagePath,
    truncateOnWordBoundary,
    extractFirstSentence,
} from '../formatting.js';
import { entity } from './helpers.js';

// ── convertEntities ──────────────────────────────────────────────────────────

describe('convertEntities', () => {

    it('passes plain text through', () => {
        expect(convertEntities([entity('plain', 'hello')], false)).toBe('hello');
    });

    it('wraps bold in **', () => {
        expect(convertEntities([entity('bold', 'strong')], false)).toBe('**strong**');
    });

    it('wraps italic in *', () => {
        expect(convertEntities([entity('italic', 'em')], false)).toBe('*em*');
    });

    it('wraps code in backticks', () => {
        expect(convertEntities([entity('code', 'const x')], false)).toBe('`const x`');
    });

    it('wraps pre in triple backticks', () => {
        expect(convertEntities([entity('pre', 'code block')], false)).toBe('```\ncode block\n```');
    });

    it('converts text_link to markdown link', () => {
        expect(convertEntities([entity('text_link', 'click', 'https://example.com')], false))
            .toBe('[click](https://example.com)');
    });

    it('wraps spoiler in span', () => {
        expect(convertEntities([entity('spoiler', 'secret')], false))
            .toBe('<span class="spoiler">secret</span>');
    });

    it('prefixes blockquote lines with >', () => {
        expect(convertEntities([entity('blockquote', 'line1\nline2')], false))
            .toBe('> line1\n> line2');
    });

    it('wraps underline in <u> tag', () => {
        expect(convertEntities([entity('underline', 'text')], false)).toBe('<u>text</u>');
    });

    it('wraps strikethrough in ~~', () => {
        expect(convertEntities([entity('strikethrough', 'old')], false)).toBe('~~old~~');
    });

    it('outputs custom_emoji text as-is', () => {
        expect(convertEntities([entity('custom_emoji', '🔥')], false)).toBe('🔥');
    });

    it('wraps bot_command in backticks', () => {
        expect(convertEntities([entity('bot_command', '/start')], false)).toBe('`/start`');
    });

    it('passes hashtag and mention through', () => {
        expect(convertEntities([entity('hashtag', '#tag')], false)).toBe('#tag');
        expect(convertEntities([entity('mention', '@user')], false)).toBe('@user');
    });

    it('outputs unknown types as plain text', () => {
        expect(convertEntities([entity('some_future_type', 'text')], false)).toBe('text');
    });

    it('returns empty string for empty array', () => {
        expect(convertEntities([], false)).toBe('');
    });

    it('skips first bold when skipFirstBold=true', () => {
        const entities = [
            entity('bold', 'Title'),
            entity('plain', '\n'),
            entity('bold', 'not skipped'),
        ];
        expect(convertEntities(entities, true)).toBe('\n**not skipped**');
    });

    it('does not skip first bold when skipFirstBold=false', () => {
        const entities = [entity('bold', 'Title'), entity('plain', ' rest')];
        expect(convertEntities(entities, false)).toBe('**Title** rest');
    });

    it('handles combination of different entity types', () => {
        const entities = [
            entity('plain', 'Hello '),
            entity('bold', 'world'),
            entity('plain', ', see '),
            entity('text_link', 'docs', 'https://docs.com'),
        ];
        expect(convertEntities(entities, false))
            .toBe('Hello **world**, see [docs](https://docs.com)');
    });
});

// ── formatAstroDate ──────────────────────────────────────────────────────────

describe('formatAstroDate', () => {
    it('formats a date in "Mon DD YYYY" format', () => {
        expect(formatAstroDate('2026-02-02T13:43:57')).toBe('Feb 02 2026');
    });

    it('handles end of year', () => {
        expect(formatAstroDate('2025-12-31T23:59:59')).toBe('Dec 31 2025');
    });

    it('handles start of year', () => {
        expect(formatAstroDate('2026-01-01T00:00:00')).toBe('Jan 01 2026');
    });
});

// ── escapeYaml ───────────────────────────────────────────────────────────────

describe('escapeYaml', () => {
    it('escapes single quotes', () => {
        expect(escapeYaml("It's fine")).toBe("It''s fine");
    });

    it('returns unchanged string without quotes', () => {
        expect(escapeYaml('No quotes')).toBe('No quotes');
    });

    it('escapes multiple single quotes', () => {
        expect(escapeYaml("It's a 'test'")).toBe("It''s a ''test''");
    });
});

// ── getPhotoImagePath ────────────────────────────────────────────────────────

describe('getPhotoImagePath', () => {
    it('extracts filename from path with directory', () => {
        expect(getPhotoImagePath('photos/photo_123.jpg')).toBe('/images/photo_123.jpg');
    });

    it('handles plain filename', () => {
        expect(getPhotoImagePath('photo.png')).toBe('/images/photo.png');
    });
});

// ── truncateOnWordBoundary ───────────────────────────────────────────────────

describe('truncateOnWordBoundary', () => {
    it('returns short text unchanged', () => {
        expect(truncateOnWordBoundary('short', 100)).toBe('short');
    });

    it('truncates on word boundary with ellipsis', () => {
        const text = 'This is a somewhat long sentence that needs to be cut';
        const result = truncateOnWordBoundary(text, 30);
        expect(result).toMatch(/\.\.\.$/);
        expect(result.length).toBeLessThanOrEqual(33); // 30 + "..."
    });

    it('removes trailing punctuation before ellipsis', () => {
        const text = 'Hello, world! It is great, here we go';
        const result = truncateOnWordBoundary(text, 26);
        // Should not end with ",..." — trailing punct stripped
        expect(result).not.toMatch(/[,;:!?.\-–—]+\.\.\.$/);
        expect(result).toMatch(/\.\.\.$/);
    });
});

// ── extractFirstSentence ─────────────────────────────────────────────────────

describe('extractFirstSentence', () => {
    it('extracts first sentence ending with period', () => {
        expect(extractFirstSentence('Hello world. More text.')).toBe('Hello world.');
    });

    it('extracts sentence ending with question mark', () => {
        expect(extractFirstSentence('Really? Yes.')).toBe('Really?');
    });

    it('extracts sentence ending with exclamation mark', () => {
        expect(extractFirstSentence('Wow! Amazing.')).toBe('Wow!');
    });

    it('returns full text when no sentence boundary', () => {
        expect(extractFirstSentence('no punctuation here')).toBe('no punctuation here');
    });

    it('trims whitespace', () => {
        expect(extractFirstSentence('  Hello.  ')).toBe('Hello.');
    });
});
