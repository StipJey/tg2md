import { describe, it, expect } from 'vitest';
import { generateFilename, convertMessage } from '../converter.js';
import type { Message, TextEntity } from '../types.js';

const entity = (type: string, text: string, href?: string): TextEntity => ({
    type,
    text,
    ...(href ? { href } : {}),
});

function makeMsg(
    entities: TextEntity[],
    overrides: Partial<Message> = {},
): Message {
    return {
        id: 1,
        type: 'message',
        date: '2026-03-15T14:30:00',
        date_unixtime: '1773764200',
        from: 'Author',
        from_id: 'user1',
        text: entities.map((e) => e.text).join(''),
        text_entities: entities,
        ...overrides,
    };
}

// ── generateFilename ─────────────────────────────────────────────────────────

describe('generateFilename', () => {
    it('generates YYYY-MM-DD-slug.md format', () => {
        const msg = makeMsg([entity('bold', 'Hello World')]);
        expect(generateFilename(msg)).toBe('2026-03-15-hello-world.md');
    });

    it('transliterates cyrillic title', () => {
        const msg = makeMsg([entity('bold', 'Привет мир')]);
        expect(generateFilename(msg)).toBe('2026-03-15-privet-mir.md');
    });

    it('uses date from message', () => {
        const msg = makeMsg([entity('bold', 'Test')], {
            date: '2025-01-05T09:00:00',
        });
        expect(generateFilename(msg)).toBe('2025-01-05-test.md');
    });
});

// ── convertMessage ───────────────────────────────────────────────────────────

describe('convertMessage', () => {
    it('generates frontmatter with title, description, and pubDate', () => {
        const msg = makeMsg([
            entity('bold', 'My Post'),
            entity('plain', '\n\nSome body text here.'),
        ]);
        const md = convertMessage(msg);

        expect(md).toContain("title: 'My Post'");
        expect(md).toContain("pubDate: 'Mar 15 2026'");
        expect(md).toContain('---');
    });

    it('includes heroImage in frontmatter when photo exists', () => {
        const msg = makeMsg([entity('bold', 'Photo Post')], {
            photo: 'photos/img_001.jpg',
        });
        const md = convertMessage(msg);
        expect(md).toContain("heroImage: '/images/img_001.jpg'");
    });

    it('does not include heroImage when no photo', () => {
        const msg = makeMsg([entity('bold', 'Text Post')]);
        const md = convertMessage(msg);
        expect(md).not.toContain('heroImage');
    });

    it('excludes first bold title from the body', () => {
        const msg = makeMsg([
            entity('bold', 'Title'),
            entity('plain', '\nBody here'),
        ]);
        const md = convertMessage(msg);

        // Title appears in frontmatter but not as **Title** in body
        expect(md).toContain("title: 'Title'");
        expect(md).not.toContain('**Title**');
        expect(md).toContain('Body here');
    });

    it('escapes single quotes in frontmatter', () => {
        const msg = makeMsg([entity('bold', "It's a test")]);
        const md = convertMessage(msg);
        expect(md).toContain("title: 'It''s a test'");
    });

    it('ends with a newline', () => {
        const msg = makeMsg([entity('plain', 'Text')]);
        expect(convertMessage(msg)).toMatch(/\n$/);
    });
});
