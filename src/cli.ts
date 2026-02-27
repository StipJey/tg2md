import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseExport } from './parser.js';
import { convertMessage, generateFilename } from './converter.js';

// ── ANSI colors ──────────────────────────────────────────────────────────────
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[97m',
} as const;

const DIVIDER = `${c.dim}  ─────────────────────────────────────────────────${c.reset}`;
const DEFAULT_OUTPUT = './output';

// ── Help ─────────────────────────────────────────────────────────────────────
function printHelp(): void {
    console.log(`
${c.cyan}${c.bold}  ████████╗ ██████╗ ██████╗ ███╗   ███╗██████╗${c.reset}
${c.cyan}${c.bold}     ██╔══╝██╔════╝╚═════██╗████╗ ████║██╔══██╗${c.reset}
${c.cyan}${c.bold}     ██║   ██║  ███╗ █████╔╝██╔████╔██║██║  ██║${c.reset}
${c.cyan}${c.bold}     ██║   ██║   ██║██╔═══╝ ██║╚██╔╝██║██║  ██║${c.reset}
${c.cyan}${c.bold}     ██║   ╚██████╔╝███████╗██║ ╚═╝ ██║██████╔╝${c.reset}
${c.cyan}${c.bold}     ╚═╝    ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═════╝ ${c.reset}

${c.white}${c.bold}  Convert Telegram channel export to Markdown files${c.reset}
${DIVIDER}

${c.yellow}${c.bold}  USAGE${c.reset}
${c.green}    npx tg2md${c.reset} ${c.white}<path-to-result.json>${c.reset} ${c.blue}[options]${c.reset}

${c.yellow}${c.bold}  OPTIONS${c.reset}
${c.green}    --output${c.reset},  ${c.green}-o${c.reset}   ${c.white}Output directory${c.reset}            ${c.dim}(default: ${DEFAULT_OUTPUT})${c.reset}
${c.green}    --rewrite${c.reset}, ${c.green}-r${c.reset}   ${c.white}Overwrite existing files${c.reset}
${c.green}    --clean${c.reset},   ${c.green}-c${c.reset}   ${c.white}Wipe output directory before conversion${c.reset}
${c.green}    --help${c.reset},    ${c.green}-h${c.reset}   ${c.white}Show this help message${c.reset}

${c.yellow}${c.bold}  NOTE${c.reset}
${c.dim}    By default, existing files are ${c.reset}${c.white}not overwritten${c.reset}${c.dim}. Use:${c.reset}
${c.green}      --rewrite${c.reset}${c.dim}  to overwrite existing files in place${c.reset}
${c.green}      --clean${c.reset}${c.dim}    to wipe the entire output directory first${c.reset}

${c.yellow}${c.bold}  EXAMPLES${c.reset}
${c.dim}    # Basic conversion (skips existing files):${c.reset}
${c.green}    npx tg2md${c.reset} ${c.white}"ChatExport/result.json"${c.reset}

${c.dim}    # Output to a custom directory:${c.reset}
${c.green}    npx tg2md${c.reset} ${c.white}"ChatExport/result.json"${c.reset} ${c.green}-o${c.reset} ${c.white}./posts${c.reset}

${c.dim}    # Overwrite previously generated files:${c.reset}
${c.green}    npx tg2md${c.reset} ${c.white}"ChatExport/result.json"${c.reset} ${c.green}--rewrite${c.reset}

${c.dim}    # Start fresh — wipe output and regenerate:${c.reset}
${c.green}    npx tg2md${c.reset} ${c.white}"ChatExport/result.json"${c.reset} ${c.green}--clean${c.reset}

${c.yellow}${c.bold}  AUTHOR${c.reset}
${c.magenta}    Telegram channel → https://t.me/+Gwp1QEKuDMlkMzRi${c.reset}
${DIVIDER}
`);
}

// ── Argument parsing ──────────────────────────────────────────────────────────
interface Args {
    inputPath: string;
    outputDir: string;
    clean: boolean;
    rewrite: boolean;
}

const KNOWN_FLAGS = new Set([
    '--output', '-o',
    '--rewrite', '-r',
    '--clean', '-c',
    '--help', '-h',
]);

export function parseArgs(argv: string[]): Args {
    // Validate flags
    const outputIdx = argv.findIndex((a) => a === '--output' || a === '-o');

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg.startsWith('-')) continue;
        if (KNOWN_FLAGS.has(arg)) {
            // Skip the value after --output / -o
            if (arg === '--output' || arg === '-o') i++;
            continue;
        }
        console.error(`\n${c.red}${c.bold}  ✖ Unknown option:${c.reset} ${c.white}${arg}${c.reset}`);
        console.error(`${c.dim}    Run with ${c.reset}${c.green}--help${c.reset}${c.dim} to see available options.${c.reset}\n`);
        process.exit(1);
    }

    if (outputIdx !== -1 && (!argv[outputIdx + 1] || argv[outputIdx + 1].startsWith('-'))) {
        console.error(`\n${c.red}${c.bold}  ✖ Missing value for ${c.reset}${c.green}${argv[outputIdx]}${c.reset}`);
        console.error(`${c.dim}    Expected: ${c.reset}${c.green}${argv[outputIdx]}${c.reset} ${c.white}<directory>${c.reset}\n`);
        process.exit(1);
    }

    const outputDir = outputIdx !== -1 && argv[outputIdx + 1]
        ? argv[outputIdx + 1]
        : DEFAULT_OUTPUT;

    const clean = argv.includes('--clean') || argv.includes('-c');
    const rewrite = argv.includes('--rewrite') || argv.includes('-r');

    // First positional argument is the input path (skip values of --output / -o)
    const skipIdx = outputIdx !== -1 ? outputIdx + 1 : -1;
    const inputPath = argv.find((a, i) => !a.startsWith('-') && i !== skipIdx) ?? '';

    return { inputPath, outputDir, clean, rewrite };
}

// ── Deduplication helper ──────────────────────────────────────────────────────
export function uniqueFilename(filename: string, used: Set<string>, id: number): string {
    if (!used.has(filename)) return filename;

    const ext = path.extname(filename);
    const base = filename.slice(0, -ext.length);
    return `${base}-${id}${ext}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function main(): void {
    const argv = process.argv.slice(2);

    if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
        printHelp();
        process.exit(0);
    }

    const { inputPath, outputDir, clean, rewrite } = parseArgs(argv);

    if (!inputPath) {
        console.error(`\n${c.red}${c.bold}  ✖ No input file specified.${c.reset} Run with ${c.green}--help${c.reset} for usage.\n`);
        process.exit(1);
    }

    if (!fs.existsSync(inputPath)) {
        console.error(`\n${c.red}${c.bold}  ✖ File not found:${c.reset} ${c.white}${inputPath}${c.reset}\n`);
        process.exit(1);
    }

    const startTime = process.hrtime.bigint();

    // ── Parse export ────────────────────────────────────────────────────────
    console.log(`\n${DIVIDER}`);
    console.log(`${c.cyan}  📂 Reading  ${c.reset}${c.white}${inputPath}${c.reset}`);

    const { channelName, messages, sourceDir } = parseExport(inputPath);

    console.log(`${c.cyan}  📺 Channel  ${c.reset}${c.white}${c.bold}${channelName}${c.reset}`);
    console.log(`${c.cyan}  📝 Messages ${c.reset}${c.white}${c.bold}${messages.length}${c.reset}`);
    console.log(`${DIVIDER}\n`);

    // ── Prepare output directories ───────────────────────────────────────────
    const outputPath = path.resolve(outputDir);
    const imagesPath = path.join(outputPath, 'images');

    if (clean && fs.existsSync(outputPath)) {
        fs.rmSync(outputPath, { recursive: true, force: true });
        console.log(`${c.yellow}  🗑  Cleared  ${c.reset}${c.dim}${outputPath}${c.reset}\n`);
    }
    fs.mkdirSync(outputPath, { recursive: true });
    fs.mkdirSync(imagesPath, { recursive: true });

    // ── Convert messages ─────────────────────────────────────────────────────
    let created = 0;
    let skipped = 0;
    let imagesCopied = 0;
    const usedFilenames = new Set<string>();

    for (const msg of messages) {
        const filename = uniqueFilename(generateFilename(msg), usedFilenames, msg.id);
        usedFilenames.add(filename);

        const filePath = path.join(outputPath, filename);
        const title = filename.replace(/\.md$/, '');

        // Skip existing files unless --rewrite is set
        if (!rewrite && fs.existsSync(filePath)) {
            console.log(`  ${c.dim}⊘  ${title} (skipped)${c.reset}`);
            skipped++;
            continue;
        }

        const markdown = convertMessage(msg);
        fs.writeFileSync(filePath, markdown, 'utf-8');

        if (msg.photo) {
            const photoSrc = path.join(sourceDir, msg.photo);
            const photoFilename = msg.photo.split('/').pop() ?? msg.photo;
            const photoDst = path.join(imagesPath, photoFilename);

            if (fs.existsSync(photoSrc)) {
                fs.copyFileSync(photoSrc, photoDst);
                imagesCopied++;
            } else {
                console.warn(`  ${c.yellow}⚠  Image not found:${c.reset} ${c.dim}${photoSrc}${c.reset}`);
            }
        }

        console.log(`  ${c.green}✔${c.reset}  ${c.dim}${title}${c.reset}`);
        created++;
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    const elapsed = elapsedMs < 1000
        ? `${elapsedMs.toFixed(0)} ms`
        : `${(elapsedMs / 1000).toFixed(2)} s`;

    console.log(`
${DIVIDER}
${c.green}${c.bold}  ✔ Done!${c.reset}

${c.cyan}    Files created  ${c.reset}${c.white}${c.bold}${created}${c.reset}
${c.cyan}    Images copied  ${c.reset}${c.white}${c.bold}${imagesCopied}${c.reset}
${c.cyan}    Output         ${c.reset}${c.white}${outputPath}${c.reset}
${c.magenta}    Time elapsed   ${c.reset}${c.white}${c.bold}${elapsed}${c.reset}
${DIVIDER}
`);

    if (skipped > 0) {
        console.log(`${c.yellow}${c.bold}  ⚠ ${skipped} file(s) skipped${c.reset}${c.dim} (already exist)${c.reset}`);
        console.log(`${c.dim}    Use ${c.reset}${c.green}--rewrite${c.reset}${c.dim} (${c.reset}${c.green}-r${c.reset}${c.dim}) to overwrite, or ${c.reset}${c.green}--clean${c.reset}${c.dim} (${c.reset}${c.green}-c${c.reset}${c.dim}) to wipe the directory first.${c.reset}\n`);
    }
}
