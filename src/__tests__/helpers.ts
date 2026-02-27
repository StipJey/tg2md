import type { Message, TextEntity } from '../types.js';

/**
 * Create a TextEntity for use in tests.
 */
export const entity = (type: string, text: string, href?: string): TextEntity => ({
    type,
    text,
    ...(href ? { href } : {}),
});

/**
 * Create a minimal Message with given text_entities for use in tests.
 */
export function makeMsg(
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
