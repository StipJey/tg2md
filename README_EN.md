# tg2md

**A CLI tool to convert Telegram channel exports into Markdown articles**

Transforms `result.json` from a Telegram export into individual `.md` files ready for [Astro](https://astro.build/) or any other static site generator.

---

## Quick Start

```bash
npx tg2md <path-to-result.json> [--output <dir>]
```

Example:

```bash
npx tg2md ./ChatExport/result.json -o ./src/content/blog
```

---

## Installation

Run without installing via `npx`, or install globally:

```bash
npm install -g tg2md
tg2md ./ChatExport/result.json -o ./output
```

---

## How to Get result.json

1. Open **Telegram Desktop**
2. Navigate to the channel you want to export
3. Click ⋮ → **Export Chat History**
4. Select format: **JSON**
5. Optionally enable photo downloads
6. Click **Export**

You'll find `result.json` in the export folder (along with a `photos/` directory if you enabled photo export).

---

## What Happens During Conversion

### Each post → a separate `.md` file

Filenames are auto-generated:

```
YYYY-MM-DD-transliterated-title.md
```

Example:
```
2026-02-22-everything-you-need-to-know-about-lithium-ion-batteries.md
```

### Astro-compatible Frontmatter

Every file starts with YAML frontmatter:

```yaml
---
title: 'Everything You Need to Know About Lithium-Ion Batteries'
description: 'I am currently skiing in the mountains above the Arctic Circle and it is cold...'
pubDate: 'Feb 22 2026'
heroImage: '/images/photo_278@22-02-2026.jpg'
---
```

- **title** — the first `bold` segment of the post. Falls back to the first sentence of the first line if there is no bold text
- **description** — the first paragraph of body text (excluding the title), truncated at a word boundary with `...`
- **pubDate** — the post's publication date
- **heroImage** — image path (only present if the post contains a photo)

### Text Formatting

| Telegram | Markdown |
|---|---|
| **Bold** | `**bold**` |
| _Italic_ | `*italic*` |
| ~~Strikethrough~~ | `~~strikethrough~~` |
| <u>Underline</u> | `<u>underline</u>` |
| Spoiler | `<span class="spoiler">text</span>` |
| Blockquote | `> text` |
| Inline code | `` `code` `` |
| Code block | ` ```code``` ` |
| [Hyperlink](url) | `[text](url)` |
| Bot command `/start` | `` `/start` `` |
| Custom emoji 🤌 | Standard emoji (uses the text fallback field) |

### Photos

Photos are copied into an `images/` subfolder inside the output directory.

The path in frontmatter follows the pattern: `/images/filename.jpg`

> **Note:** The photo files must be present in the export folder. When exporting from Telegram Desktop, make sure to enable photo download.

### What Gets Ignored

- **Forwarded messages** — skipped entirely, not converted to Markdown
- **Videos** — any text caption is preserved, but the video file is not copied
- **Reactions** — not included in the output
- **Reply context** (`reply_to`) — the referenced message is not added

### Output Folder Cleanup

The output directory is **fully cleared** before every run. This ensures no stale files from previous runs (deleted or renamed posts) remain.

---

## Output Structure

```
output/
├── images/
│   ├── photo_272@06-02-2026_22-06-23.jpg
│   └── photo_273@10-02-2026_13-32-02.jpg
├── 2026-02-02-gaming-in-telegram-comments.md
├── 2026-02-04-i-love-freebies.md
└── 2026-02-22-lithium-ion-batteries.md
```

---

## Astro Integration

Copy the contents of `output/` into your Astro project:

```
src/content/blog/    ← .md files go here
public/images/       ← images/ folder goes here
```

Make sure your `src/content/config.ts` defines the `blog` collection with the matching fields:

```ts
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
  }),
});
```

---

## CLI Options

```
Usage:
  npx tg2md <path-to-result.json> [--output <dir>]

Options:
  --output, -o   Output directory (default: ./output)
  --help, -h     Show help
```

---

## Code Structure

```
src/
├── index.ts        — CLI entry point and orchestration
├── parser.ts       — reads and filters result.json
├── converter.ts    — assembles a .md file from a message
├── extractors.ts   — extracts title and description
├── formatting.ts   — entity → markdown conversion and utilities
├── slugify.ts      — Cyrillic transliteration and slug generation
└── types.ts        — TypeScript types for result.json
```

---

## Author

**Evgeny Cherkasov** — [Don't miss interesting posts in my Telegram channel](https://t.me/+Gwp1QEKuDMlkMzRi)

## License

MIT
