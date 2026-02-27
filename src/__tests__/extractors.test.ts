import { describe, it, expect } from 'vitest';
import { extractTitle, extractDescription } from '../extractors.js';
import type { Message, TextEntity } from '../types.js';

/** Helper to build a minimal Message with given text_entities */
function makeMsg(
    entities: TextEntity[],
    overrides: Partial<Message> = {},
): Message {
    return {
        id: 1,
        type: 'message',
        date: '2026-01-15T10:00:00',
        date_unixtime: '1768468800',
        from: 'Test',
        from_id: 'user123',
        text: entities.map((e) => e.text).join(''),
        text_entities: entities,
        ...overrides,
    };
}

const entity = (type: string, text: string): TextEntity => ({ type, text });

// ── extractTitle ─────────────────────────────────────────────────────────────

describe('extractTitle', () => {
    it('uses first bold entity as title', () => {
        const msg = makeMsg([
            entity('bold', 'My Title'),
            entity('plain', '\nSome body text'),
        ]);
        expect(extractTitle(msg)).toBe('My Title');
    });

    it('trims bold title whitespace', () => {
        const msg = makeMsg([entity('bold', '  Spaced Title  ')]);
        expect(extractTitle(msg)).toBe('Spaced Title');
    });

    it('falls back to first sentence of plain text when no bold', () => {
        const msg = makeMsg([entity('plain', 'First sentence. Second sentence.')]);
        expect(extractTitle(msg)).toBe('First sentence.');
    });

    it('falls back to post-{id} when entities are empty', () => {
        const msg = makeMsg([], { id: 42 });
        expect(extractTitle(msg)).toBe('post-42');
    });

    it('falls back to post-{id} when only whitespace bold', () => {
        const msg = makeMsg([entity('bold', '   ')], { id: 7 });
        expect(extractTitle(msg)).toBe('post-7');
    });

    it('truncates long first sentence to 100 chars with ellipsis', () => {
        const longSentence = 'A'.repeat(50) + ' ' + 'B'.repeat(60) + '.';
        const msg = makeMsg([entity('plain', longSentence)]);
        const title = extractTitle(msg);
        expect(title.length).toBeLessThanOrEqual(103); // 100 + "..."
        expect(title).toMatch(/\.\.\.$/);
    });

    it('uses first non-empty line for fallback', () => {
        const msg = makeMsg([entity('plain', '\n\nActual content. More text.')]);
        expect(extractTitle(msg)).toBe('Actual content.');
    });
});

// ── extractDescription ───────────────────────────────────────────────────────

describe('extractDescription', () => {
    it('returns first paragraph after title', () => {
        const msg = makeMsg([
            entity('bold', 'Title'),
            entity('plain', '\n\nFirst paragraph here.\n\nSecond paragraph.'),
        ]);
        const desc = extractDescription(msg);
        expect(desc).toBe('First paragraph here.');
    });

    it('truncates long description to 160 chars with ellipsis', () => {
        const longParagraph = ('word '.repeat(50)).trim() + '.';
        const msg = makeMsg([
            entity('bold', 'Title'),
            entity('plain', '\n\n' + longParagraph),
        ]);
        const desc = extractDescription(msg);
        expect(desc.length).toBeLessThanOrEqual(163); // 160 + "..."
    });

    it('falls back to title when no other text', () => {
        const msg = makeMsg([entity('bold', 'Only Title')]);
        expect(extractDescription(msg)).toBe('Only Title');
    });

    it('takes only the first paragraph', () => {
        const msg = makeMsg([
            entity('bold', 'T'),
            entity('plain', '\n\nP1 text.\n\nP2 text.'),
        ]);
        expect(extractDescription(msg)).toBe('P1 text.');
    });

    it('replaces newlines with spaces within paragraph', () => {
        const msg = makeMsg([
            entity('bold', 'T'),
            entity('plain', '\n\nLine1\nLine2\nLine3'),
        ]);
        expect(extractDescription(msg)).toBe('Line1 Line2 Line3');
    });
});
