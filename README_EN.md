# 📨 tg2md

[![npm](https://img.shields.io/npm/v/tg2md)](https://www.npmjs.com/package/tg2md)
[![license](https://img.shields.io/npm/l/tg2md)](LICENSE)

**A CLI tool to convert Telegram channel exports into Markdown articles.**

Transforms `result.json` from a Telegram export into individual `.md` files ready for [Astro](https://astro.build/) or any other static site generator. Also great for importing content into Obsidian, Logseq, and other Markdown-first tools.

---

## ⚡ Quick Start

```bash
npx tg2md <path-to-result.json>
```

```bash
# Custom output directory:
npx tg2md ./ChatExport/result.json -o ./src/content/blog

# Overwrite existing files:
npx tg2md ./ChatExport/result.json --rewrite

# Wipe output directory and regenerate:
npx tg2md ./ChatExport/result.json --clean
```

---

## 📦 Installation

Run without installing via `npx`, or install globally:

```bash
npm install -g tg2md
```

---

## 📥 How to Get result.json

1. Open [Telegram Desktop](https://desktop.telegram.org/) _(not Telegram for macOS)_
2. Navigate to the channel you want to export
3. Click **⋮** → **Export Chat History**
4. Select format: **JSON**
5. Enable photo downloads
6. Click **Export**

You'll find `result.json` in the export folder along with a `photos/` directory.

---

## 🔄 What Happens During Conversion

### Each post → a separate `.md` file

Filenames are auto-generated:

```
YYYY-MM-DD-transliterated-title.md
```

Example: `2026-02-22-everything-you-need-to-know-about-lithium-ion-batteries.md`

### Astro-compatible Frontmatter

```yaml
---
title: 'Everything You Need to Know About Lithium-Ion Batteries'
description: 'I am currently skiing in the mountains above the Arctic Circle and it is cold...'
pubDate: 'Feb 22 2026'
heroImage: '/images/photo_278@22-02-2026.jpg'
---
```

| Field | Source |
|-------|--------|
| `title` | First **bold** segment of the post. Falls back to the first sentence |
| `description` | First paragraph of body text (excluding title), truncated to ~160 chars |
| `pubDate` | Post publication date |
| `heroImage` | Image path (only if the post contains a photo) |

### Text Formatting

| Telegram | Markdown |
|----------|----------|
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
| Custom emoji 🤌 | Standard emoji (fallback) |

### 🖼 Photos

Photos are copied into an `images/` subfolder inside the output directory. Frontmatter path: `/images/filename.jpg`

> **Note:** Photo files must be present in the export folder. Make sure to enable photo downloads when exporting from Telegram Desktop.

### 🚫 What Gets Ignored

- **Forwarded messages** — skipped entirely
- **Videos** — text captions preserved, video files not copied
- **Reactions** — not included
- **Reply context** (`reply_to`) — referenced message not added

---

## 📁 Output Structure

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

## 🚀 Astro Integration

Copy the contents of `output/` into your Astro project:

```
src/content/blog/    ← .md files
public/images/       ← images
```

Make sure your `src/content/config.ts` defines the `blog` collection:

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

## 🛠 CLI Options

| Flag | Description | Default |
|------|-------------|---------|
| `--output`, `-o` | Output directory | `./output` |
| `--rewrite`, `-r` | Overwrite existing files | — |
| `--clean`, `-c` | Wipe output directory before conversion | — |
| `--help`, `-h` | Show help | — |

> **Note:** By default, existing files are **not overwritten** — they are skipped, and a hint is displayed at the end.

---

## 🧪 Tests

```bash
npx vitest run         # single run
npx vitest             # watch mode
```

More details → [`src/__tests__/README.md`](src/__tests__/README.md)

---

## 🏗 Code Structure

```
src/
├── index.ts          # CLI entry point
├── cli.ts            # CLI logic: parseArgs, uniqueFilename, main
├── parser.ts         # Reads and filters result.json
├── converter.ts      # Assembles a .md file from a message
├── extractors.ts     # Extracts title and description
├── formatting.ts     # Entity → Markdown conversion and utilities
├── slugify.ts        # Cyrillic transliteration and slug generation
└── types.ts          # TypeScript types for result.json
```

---

## 👤 Author

**Evgeny Cherkasov** — [Telegram channel 📬](https://t.me/+Gwp1QEKuDMlkMzRi)

## 📄 License

MIT
