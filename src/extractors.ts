import type { Message } from './types.js';
import { extractFirstSentence, truncateOnWordBoundary } from './formatting.js';

/**
 * Extract the title from a message.
 * Uses the first bold entity, or falls back to the first sentence of text.
 */
export function extractTitle(msg: Message): string {
    // Look for the first bold entity
    for (const entity of msg.text_entities) {
        if (entity.type === 'bold' && entity.text.trim()) {
            return entity.text.trim();
        }
    }

    // Fallback: first sentence within the first non-empty line
    const plainText = msg.text_entities
        .filter((e) => e.type === 'plain')
        .map((e) => e.text)
        .join('')
        .trim();

    if (plainText) {
        // Take only the first non-empty line, then extract the first sentence from it
        const firstLine = plainText.split('\n').find((l) => l.trim()) ?? '';
        const sentence = extractFirstSentence(firstLine.trim());
        if (sentence) {
            return truncateOnWordBoundary(sentence, 100);
        }
    }

    return `post-${msg.id}`;
}

/**
 * Extract a short description from the message for the frontmatter.
 * Takes the first paragraph of plain text (not the title).
 * Truncates on word boundary with "..." if too long.
 */
export function extractDescription(msg: Message): string {
    const title = extractTitle(msg);
    const fullText = msg.text_entities
        .map((e) => e.text)
        .join('');

    // Remove the title from the beginning
    let rest = fullText;
    const titleIdx = rest.indexOf(title);
    if (titleIdx !== -1) {
        rest = rest.substring(titleIdx + title.length);
    }

    // Get first meaningful paragraph
    const paragraphs = rest.split('\n\n').filter((p) => p.trim().length > 0);
    const firstParagraph = paragraphs[0]?.trim() ?? '';

    // Clean up newlines and truncate on word boundary
    const clean = firstParagraph.replace(/\n/g, ' ');
    const result = truncateOnWordBoundary(clean, 160);

    return result || title;
}
