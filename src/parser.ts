import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TelegramExport, Message } from './types.js';

export interface ParseResult {
    channelName: string;
    messages: Message[];
    sourceDir: string;
}

/**
 * Parse result.json and return filtered messages.
 * Skips forwarded messages and non-message types.
 */
export function parseExport(filePath: string): ParseResult {
    const absolutePath = path.resolve(filePath);
    const sourceDir = path.dirname(absolutePath);

    const raw = fs.readFileSync(absolutePath, 'utf-8');
    const data: TelegramExport = JSON.parse(raw);

    const messages = data.messages.filter((msg) => {
        // Only regular messages
        if (msg.type !== 'message') return false;
        // Skip forwarded messages (reposts)
        if (msg.forwarded_from) return false;
        // Skip messages with only video (no text content)
        if (msg.media_type === 'video_file' && isEmptyText(msg.text)) return false;
        return true;
    });

    return {
        channelName: data.name,
        messages,
        sourceDir,
    };
}

function isEmptyText(text: string | unknown[]): boolean {
    if (typeof text === 'string') return text.trim() === '';
    if (Array.isArray(text)) {
        return text.every((part) => {
            if (typeof part === 'string') return part.trim() === '';
            return false;
        });
    }
    return true;
}
