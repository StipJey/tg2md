import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseExport } from './parser.js';
import { convertMessage, generateFilename } from './converter.js';

function main(): void {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
tg2md — Convert Telegram channel export to Markdown files

Usage:
  npx tsx src/index.ts <path-to-result.json> [--output <dir>]

Options:
  --output, -o   Output directory (default: ./output)
  --help, -h     Show this help message

Example:
  npx tsx src/index.ts "examples/ChatExport_2026-02-27 (1)/result.json" -o ./output
    `);
        process.exit(0);
    }

    const inputPath = args[0];
    let outputDir = './output';

    // Parse --output / -o flag
    const outputIdx = args.findIndex((a) => a === '--output' || a === '-o');
    if (outputIdx !== -1 && args[outputIdx + 1]) {
        outputDir = args[outputIdx + 1];
    }

    // Validate input file
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ File not found: ${inputPath}`);
        process.exit(1);
    }

    console.log(`📂 Reading: ${inputPath}`);

    const { channelName, messages, sourceDir } = parseExport(inputPath);

    console.log(`📺 Channel: ${channelName}`);
    console.log(`📝 Messages: ${messages.length}\n`);

    // Clear and recreate output dirs
    const outputPath = path.resolve(outputDir);
    const imagesPath = path.join(outputPath, 'images');
    if (fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
        console.log(`🗑️  Cleared: ${outputPath}\n`);
    }
    fs.mkdirSync(outputPath, { recursive: true });
    fs.mkdirSync(imagesPath, { recursive: true });

    let created = 0;
    const usedFilenames = new Set<string>();

    for (const msg of messages) {
        // Generate markdown
        const markdown = convertMessage(msg);
        let filename = generateFilename(msg);

        // Handle duplicate filenames
        if (usedFilenames.has(filename)) {
            const ext = path.extname(filename);
            const base = filename.slice(0, -ext.length);
            filename = `${base}-${msg.id}${ext}`;
        }
        usedFilenames.add(filename);

        // Write .md file
        const filePath = path.join(outputPath, filename);
        fs.writeFileSync(filePath, markdown, 'utf-8');

        // Copy photo if present
        if (msg.photo) {
            const photoSrc = path.join(sourceDir, msg.photo);
            const photoFilename = msg.photo.split('/').pop() ?? msg.photo;
            const photoDst = path.join(imagesPath, photoFilename);

            if (fs.existsSync(photoSrc)) {
                fs.copyFileSync(photoSrc, photoDst);
            } else {
                console.warn(`  ⚠️  Photo not found: ${photoSrc}`);
            }
        }

        const title = filename.replace(/\.md$/, '');
        console.log(`  ✅ ${title}`);
        created++;
    }

    console.log(`\n🎉 Done! Created ${created} files in ${outputPath}`);
    if (fs.readdirSync(imagesPath).length > 0) {
        console.log(`📸 Images copied to ${imagesPath}`);
    }
}

main();
