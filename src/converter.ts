import type { Message, TextEntity } from './types.js';

/**
 * Cyrillic-to-Latin transliteration map for URL-safe filenames.
 */
const TRANSLIT_MAP: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
};

/**
 * Transliterate a string to a URL-safe slug.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .split('')
        .map((char) => TRANSLIT_MAP[char] ?? char)
        .join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 80);
}

/**
 * Extract the title from a message.
 * Uses the first bold entity, or falls back to the first N chars of text.
 */
export function extractTitle(msg: Message): string {
    // Look for the first bold entity
    for (const entity of msg.text_entities) {
        if (entity.type === 'bold' && entity.text.trim()) {
            return entity.text.trim();
        }
    }

    // Fallback: first line of plain text
    const plainText = msg.text_entities
        .filter((e) => e.type === 'plain')
        .map((e) => e.text)
        .join('');

    const firstLine = plainText.split('\n').find((l) => l.trim());
    if (firstLine) {
        return firstLine.trim().substring(0, 100);
    }

    return `post-${msg.id}`;
}

/**
 * Extract a short description from the message for the frontmatter.
 * Takes the first paragraph of plain text (not the title).
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

    // Truncate and clean up
    const clean = firstParagraph.replace(/\n/g, ' ').substring(0, 160);
    return clean || title;
}

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
 * Convert text_entities array to markdown string.
 * This uses text_entities (not the text field) because text_entities
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
                // Use HTML details/summary for spoilers (works in Astro)
                result += `<span class="spoiler">${entity.text}</span>`;
                break;

            case 'blockquote':
                // Prefix each line with >
                const lines = entity.text.split('\n');
                result += lines.map((line) => `> ${line}`).join('\n');
                break;

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
                result += entity.text;
                break;

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
 * Generate the relative path to a photo image.
 */
export function getPhotoImagePath(photoPath: string): string {
    // photoPath is like "photos/photo_272@06-02-2026_22-06-23.jpg"
    // We want just the filename for the images/ folder
    const filename = photoPath.split('/').pop() ?? photoPath;
    return `/images/${filename}`;
}

/**
 * Build the frontmatter for the Astro .md file.
 */
export function buildFrontmatter(msg: Message): string {
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
 * Format a date string for Astro frontmatter.
 * Input: "2026-02-02T13:43:57" → Output: "Feb 02 2026"
 */
function formatAstroDate(dateStr: string): string {
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
function escapeYaml(value: string): string {
    return value.replace(/'/g, "''");
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

    // If there's a photo, insert it at the top of the body
    if (msg.photo) {
        const imgPath = getPhotoImagePath(msg.photo);
        body = `![](${imgPath})\n\n${body}`;
    }

    return `${frontmatter}\n\n${body}\n`;
}
