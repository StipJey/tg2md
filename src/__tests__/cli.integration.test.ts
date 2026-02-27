import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { parseArgs, uniqueFilename } from '../cli.js';

// ── parseArgs ────────────────────────────────────────────────────────────────

describe('parseArgs', () => {
    it('parses bare input path', () => {
        const args = parseArgs(['file.json']);
        expect(args.inputPath).toBe('file.json');
        expect(args.outputDir).toBe('./output');
        expect(args.clean).toBe(false);
        expect(args.rewrite).toBe(false);
    });

    it('parses --output with value', () => {
        const args = parseArgs(['file.json', '--output', './custom']);
        expect(args.outputDir).toBe('./custom');
    });

    it('parses short -o with value', () => {
        const args = parseArgs(['file.json', '-o', './custom']);
        expect(args.outputDir).toBe('./custom');
    });

    it('parses --clean flag', () => {
        expect(parseArgs(['file.json', '--clean']).clean).toBe(true);
    });

    it('parses short -c flag', () => {
        expect(parseArgs(['file.json', '-c']).clean).toBe(true);
    });

    it('parses --rewrite flag', () => {
        expect(parseArgs(['file.json', '--rewrite']).rewrite).toBe(true);
    });

    it('parses short -r flag', () => {
        expect(parseArgs(['file.json', '-r']).rewrite).toBe(true);
    });

    it('parses multiple flags together', () => {
        const args = parseArgs(['file.json', '--clean', '--rewrite', '-o', './out']);
        expect(args.clean).toBe(true);
        expect(args.rewrite).toBe(true);
        expect(args.outputDir).toBe('./out');
    });

    it('handles input path after flags', () => {
        const args = parseArgs(['-o', './out', 'file.json']);
        expect(args.inputPath).toBe('file.json');
        expect(args.outputDir).toBe('./out');
    });

    it('returns empty inputPath when none given', () => {
        const args = parseArgs(['--clean']);
        expect(args.inputPath).toBe('');
    });
});

// ── uniqueFilename ───────────────────────────────────────────────────────────

describe('uniqueFilename', () => {
    it('returns original filename when not used', () => {
        const used = new Set<string>();
        expect(uniqueFilename('2026-01-01-post.md', used, 42)).toBe('2026-01-01-post.md');
    });

    it('appends id when filename is already used', () => {
        const used = new Set(['2026-01-01-post.md']);
        expect(uniqueFilename('2026-01-01-post.md', used, 42)).toBe('2026-01-01-post-42.md');
    });

    it('preserves the extension in deduped name', () => {
        const used = new Set(['file.md']);
        const result = uniqueFilename('file.md', used, 7);
        expect(result).toMatch(/\.md$/);
        expect(result).toBe('file-7.md');
    });
});

// ── CLI Integration (E2E) ────────────────────────────────────────────────────

describe('CLI integration', () => {
    const CLI = path.resolve(import.meta.dirname, '../../dist/index.js');
    const FIXTURE = path.resolve(import.meta.dirname, 'fixtures/minimal-export.json');
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tg2md-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function run(args: string[]): { stdout: string; status: number | null } {
        try {
            const stdout = execFileSync('node', [CLI, ...args], {
                encoding: 'utf-8',
                timeout: 10_000,
            });
            return { stdout, status: 0 };
        } catch (err: any) {
            return { stdout: err.stdout ?? '', status: err.status ?? 1 };
        }
    }

    it('shows help with --help', () => {
        const { stdout, status } = run(['--help']);
        expect(status).toBe(0);
        expect(stdout).toContain('Convert Telegram');
    });

    it('shows help with no arguments', () => {
        const { stdout, status } = run([]);
        expect(status).toBe(0);
        expect(stdout).toContain('USAGE');
    });

    it('errors on nonexistent file', () => {
        const { status } = run(['/tmp/nonexistent-file-xyz.json']);
        expect(status).toBe(1);
    });

    it('errors on unknown flag', () => {
        const { status } = run(['file.json', '--unknown']);
        expect(status).toBe(1);
    });

    it('converts fixture and creates markdown files', () => {
        const outDir = path.join(tmpDir, 'out');
        const { status } = run([FIXTURE, '-o', outDir]);
        expect(status).toBe(0);

        const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.md'));
        expect(files.length).toBe(2);

        // Check first file content has frontmatter
        const content = fs.readFileSync(path.join(outDir, files[0]), 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('title:');
        expect(content).toContain('pubDate:');
    });

    it('skips existing files by default', () => {
        const outDir = path.join(tmpDir, 'out');

        // First run
        run([FIXTURE, '-o', outDir]);
        const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.md'));
        expect(files.length).toBe(2);

        // Second run — should skip
        const { stdout } = run([FIXTURE, '-o', outDir]);
        expect(stdout).toContain('skipped');
    });

    it('overwrites files with --rewrite', () => {
        const outDir = path.join(tmpDir, 'out');

        // First run
        run([FIXTURE, '-o', outDir]);

        // Modify a file
        const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.md'));
        const filePath = path.join(outDir, files[0]);
        fs.writeFileSync(filePath, 'modified', 'utf-8');

        // Rewrite run
        run([FIXTURE, '-o', outDir, '--rewrite']);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).not.toBe('modified');
        expect(content).toContain('---');
    });

    it('cleans output directory with --clean', () => {
        const outDir = path.join(tmpDir, 'out');

        // First run
        run([FIXTURE, '-o', outDir]);

        // Add an extra file
        fs.writeFileSync(path.join(outDir, 'extra.txt'), 'junk');

        // Clean run
        run([FIXTURE, '-o', outDir, '--clean']);

        // Extra file should be gone
        expect(fs.existsSync(path.join(outDir, 'extra.txt'))).toBe(false);

        // Markdown files should exist
        const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.md'));
        expect(files.length).toBe(2);
    });

    it('creates images directory', () => {
        const outDir = path.join(tmpDir, 'out');
        run([FIXTURE, '-o', outDir]);
        expect(fs.existsSync(path.join(outDir, 'images'))).toBe(true);
    });
});
