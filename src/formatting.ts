import type { TextEntity } from './types.js';

/**
 * Convert text_entities array to markdown string.
 * Uses text_entities (not the text field) because text_entities
 * has proper type annotations for each segment.
 */
export function convertEntities(entities: TextEntity[], skipFirstBold: boolean): string {
    let result = '';
    let firstBoldSkipped = false;

    for (const entity of entities) {
        switch (entity.type) {
            case 'plain':
                result += entity.text;
                break;

            case 'bold':
                if (skipFirstBold && !firstBoldSkipped) {
                    firstBoldSkipped = true;
                    // Skip the bold title — it goes into the frontmatter
                    continue;
                }
                result += `**${entity.text}**`;
                break;

            case 'italic':
                result += `*${entity.text}*`;
                break;

            case 'spoiler':
                result += `<span class="spoiler">${entity.text}</span>`;
                break;

            case 'blockquote': {
                const lines = entity.text.split('\n');
                result += lines.map((line) => `> ${line}`).join('\n');
                break;
            }

            case 'text_link':
                result += `[${entity.text}](${entity.href})`;
                break;

            case 'bot_command':
                result += `\`${entity.text}\``;
                break;

            case 'custom_emoji':
                // Use the text fallback (standard emoji)
                result += entity.text;
                break;

            case 'underline':
                result += `<u>${entity.text}</u>`;
                break;

            case 'strikethrough':
                result += `~~${entity.text}~~`;
                break;

            case 'code':
                result += `\`${entity.text}\``;
                break;

            case 'pre':
                result += `\`\`\`\n${entity.text}\n\`\`\``;
                break;

            case 'hashtag':
            case 'mention':
                result += entity.text;
                break;

            default:
                // Unknown type — just output the text
                result += entity.text;
                break;
        }
    }

    return result;
}

/**
 * Format a date string for Astro frontmatter.
 * Input: "2026-02-02T13:43:57" → Output: "Feb 02 2026"
 */
export function formatAstroDate(dateStr: string): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(dateStr);
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month} ${day} ${year}`;
}

/**
 * Escape single quotes in YAML values.
 */
export function escapeYaml(value: string): string {
    return value.replace(/'/g, "''");
}

/**
 * Generate the relative path to a photo image.
 */
export function getPhotoImagePath(photoPath: string): string {
    const filename = photoPath.split('/').pop() ?? photoPath;
    return `/images/${filename}`;
}

/**
 * Truncate text to maxLen on a word boundary, adding "..." if truncated.
 */
export function truncateOnWordBoundary(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;

    const truncated = text.substring(0, maxLen);
    const lastSpace = truncated.lastIndexOf(' ');

    const cutPoint = lastSpace > maxLen * 0.5 ? lastSpace : maxLen;
    const cut = truncated.substring(0, cutPoint);

    // Remove trailing punctuation before adding ellipsis
    const clean = cut.replace(/[,;:!?.\-–—]+$/, '');
    return clean + '...';
}

/**
 * Extract the first sentence from text.
 * A sentence ends with . ! ? followed by a space, newline, or end of string.
 */
export function extractFirstSentence(text: string): string {
    const match = text.match(/^(.+?[.!?])(?:\s|$)/s);
    if (match) {
        return match[1].trim();
    }
    // No sentence boundary found — return the whole text (up to a reasonable limit)
    return text.trim();
}
