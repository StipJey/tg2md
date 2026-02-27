import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'node:path';
import { parseExport, type ParseResult } from '../parser.js';

const FIXTURES = path.resolve(import.meta.dirname, 'fixtures');

describe('parseExport', () => {
    describe('with minimal export', () => {
        let result: ParseResult;

        beforeAll(() => {
            result = parseExport(path.join(FIXTURES, 'minimal-export.json'));
        });

        it('extracts channel name', () => {
            expect(result.channelName).toBe('Test Channel');
        });

        it('returns all regular messages', () => {
            expect(result.messages).toHaveLength(2);
        });

        it('preserves message ids', () => {
            expect(result.messages[0].id).toBe(1);
            expect(result.messages[1].id).toBe(2);
        });

        it('preserves photo path', () => {
            expect(result.messages[1].photo).toBe('photos/photo_001.jpg');
        });

        it('returns correct sourceDir', () => {
            expect(result.sourceDir).toBe(FIXTURES);
        });
    });

    describe('with mixed messages (filtering)', () => {
        let result: ParseResult;

        beforeAll(() => {
            result = parseExport(path.join(FIXTURES, 'mixed-messages.json'));
        });

        it('extracts channel name', () => {
            expect(result.channelName).toBe('Mixed Channel');
        });

        it('filters out forwarded messages', () => {
            const ids = result.messages.map((m) => m.id);
            expect(ids).not.toContain(11);
        });

        it('filters out service messages', () => {
            const ids = result.messages.map((m) => m.id);
            expect(ids).not.toContain(12);
        });

        it('filters out video-only messages (no text)', () => {
            const ids = result.messages.map((m) => m.id);
            expect(ids).not.toContain(13);
        });

        it('keeps video messages that have text', () => {
            const ids = result.messages.map((m) => m.id);
            expect(ids).toContain(14);
        });

        it('keeps normal messages', () => {
            const ids = result.messages.map((m) => m.id);
            expect(ids).toContain(10);
        });

        it('returns only 2 messages after filtering', () => {
            expect(result.messages).toHaveLength(2);
        });
    });
});
