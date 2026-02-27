import type { Message } from './types.js';
import { slugify } from './slugify.js';
import { extractTitle, extractDescription } from './extractors.js';
import {
    convertEntities,
    formatAstroDate,
    escapeYaml,
    getPhotoImagePath,
} from './formatting.js';

/**
 * Generate the filename for a message: YYYY-MM-DD-slug.md
 */
export function generateFilename(msg: Message): string {
    const date = msg.date.substring(0, 10); // "2026-02-02"
    const title = extractTitle(msg);
    const slug = slugify(title);
    return `${date}-${slug}.md`;
}

/**
 * Build the frontmatter for the Astro .md file.
 */
function buildFrontmatter(msg: Message): string {
    const title = extractTitle(msg);
    const description = extractDescription(msg);
    const pubDate = formatAstroDate(msg.date);

    const lines = [
        '---',
        `title: '${escapeYaml(title)}'`,
        `description: '${escapeYaml(description)}'`,
        `pubDate: '${pubDate}'`,
    ];

    if (msg.photo) {
        const heroImage = getPhotoImagePath(msg.photo);
        lines.push(`heroImage: '${heroImage}'`);
    }

    lines.push('---');
    return lines.join('\n');
}

/**
 * Convert a full message to a markdown string.
 */
export function convertMessage(msg: Message): string {
    const frontmatter = buildFrontmatter(msg);

    // Build markdown body from text_entities
    // Skip the first bold entity if it matches the title (it goes into frontmatter)
    let body = convertEntities(msg.text_entities, true);

    // Clean up: remove leading whitespace/newlines after title removal
    body = body.replace(/^\s*\n/, '');

    // Note: photo is NOT inserted into the body if it's in heroImage
    // Astro will render the heroImage from the frontmatter

    return `${frontmatter}\n\n${body}\n`;
}
