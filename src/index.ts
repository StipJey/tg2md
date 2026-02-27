#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseExport } from './parser.js';
import { convertMessage, generateFilename } from './converter.js';


function main(): void {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        const dim = '\x1b[2m';
        const cyan = '\x1b[36m';
        const green = '\x1b[32m';
        const yellow = '\x1b[33m';
        const blue = '\x1b[34m';
        const magenta = '\x1b[35m';
        const white = '\x1b[97m';

        console.log(`
${cyan}${bold}  ████████╗ ██████╗ ██████╗ ███╗   ███╗██████╗${reset}
${cyan}${bold}     ██╔══╝██╔════╝╚═════██╗████╗ ████║██╔══██╗${reset}
${cyan}${bold}     ██║   ██║  ███╗ █████╔╝██╔████╔██║██║  ██║${reset}
${cyan}${bold}     ██║   ██║   ██║██╔═══╝ ██║╚██╔╝██║██║  ██║${reset}
${cyan}${bold}     ██║   ╚██████╔╝███████╗██║ ╚═╝ ██║██████╔╝${reset}
${cyan}${bold}     ╚═╝    ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═════╝ ${reset}

${white}${bold}  Convert Telegram channel export to Markdown files${reset}
${dim}  ─────────────────────────────────────────────────${reset}

${yellow}${bold}  USAGE${reset}
${green}    npx tg2md${reset} ${white}<path-to-result.json>${reset} ${blue}[options]${reset}

${yellow}${bold}  OPTIONS${reset}
${green}    --output${reset}, ${green}-o${reset}   ${white}Output directory${reset}            ${dim}(default: ./output)${reset}
${green}    --help${reset},   ${green}-h${reset}   ${white}Show this help message${reset}

${yellow}${bold}  EXAMPLE${reset}
${dim}    # Export your Telegram channel via Telegram Desktop,${reset}
${dim}    # then point tg2md at the result.json file:${reset}
${green}    npx tg2md${reset} ${white}"ChatExport/result.json"${reset} ${green}-o${reset} ${white}./output${reset}

${yellow}${bold}  AUTHOR${reset}
${magenta}    Telegram channel → https://t.me/+Gwp1QEKuDMlkMzRi${reset}
${dim}  ─────────────────────────────────────────────────${reset}
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
