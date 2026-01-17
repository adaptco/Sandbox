#!/usr/bin/env node

/**
 * Markdown Lint Auto-Fixer v2
 * Fixes MD040, MD060, MD026, MD005, MD009, MD036 issues
 */

const fs = require('fs');
const path = require('path');

const MARKDOWN_FILES = [
    'CHECKPOINT_SUMMARY.md',
    'CHECKPOINTING_RITUAL.md',
    'CICD_INTEGRATION_LAYER.md',
    'QUBE_RUNTIME.md',
    'REPLAY_COURT_DECODER.md',
    'TOKEN_PIXEL_SCHEMA_V1.md',
    'TOKEN_PIXEL_SYSTEM_INDEX.md',
    'VOXEL_TENSOR_MAPPING.md'
];

class MarkdownLintFixer {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.fixCount = 0;
    }

    fixFile(filename) {
        const filepath = path.join(this.baseDir, filename);

        if (!fs.existsSync(filepath)) {
            console.log(`⚠️  File not found: ${filename}`);
            return;
        }

        console.log(`\n📄 Processing ${filename}...`);

        let content = fs.readFileSync(filepath, 'utf8');
        const originalContent = content;

        // Fix MD040: Add language to fenced code blocks
        content = this.fixFencedCodeBlocks(content, filename);

        // Fix MD060: Fix table column spacing
        content = this.fixTableColumns(content);

        // Fix MD036: Emphasis as heading
        content = this.fixEmphasisAsHeading(content);

        // Fix MD026: Trailing punctuation in headings
        content = this.fixTrailingPunctuation(content);

        // Fix MD005: List indentation
        content = this.fixListIndentation(content);

        // Fix MD009: Trailing spaces
        content = this.fixTrailingSpaces(content);

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✅ Fixed ${filename}`);
            this.fixCount++;
        } else {
            console.log(`✨ No changes needed for ${filename}`);
        }
    }

    fixFencedCodeBlocks(content, filename) {
        const lines = content.split('\n');
        const result = [];
        let inCodeBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Detect code fence
            if (trimmed.startsWith('```')) {
                if (!inCodeBlock) {
                    // Opening fence
                    const hasLang = trimmed.length > 3 && trimmed !== '```text' && trimmed !== '```';

                    if (trimmed === '```') {
                        // Add inferred language
                        const lang = this.inferLanguage(lines, i, filename);
                        const indent = line.match(/^(\s*)/)[1]; // Preserve indentation
                        result.push(indent + '```' + lang);
                        console.log(`  Fixed code block at line ${i + 1}: added language '${lang}'`);
                        inCodeBlock = true;
                    } else {
                        result.push(line);
                        inCodeBlock = true;
                    }
                } else {
                    // Closing fence
                    result.push(line);
                    inCodeBlock = false;
                }
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    inferLanguage(lines, fenceIndex, filename) {
        // Look ahead to infer language
        const nextLines = lines.slice(fenceIndex + 1, fenceIndex + 10).join('\n');

        // Check for mathematical notation
        if (nextLines.match(/[∈∉⊂⊃∩∪∀∃φψωτ]/)) {
            return 'text';  // Mathematical symbols
        }

        // Check for common patterns
        if (nextLines.includes('TokenPixel') || nextLines.includes('StateVector')) {
            return 'text';  // Type definitions
        }
        if (nextLines.includes('DISTRICT') || nextLines.includes('CHAMBER')) {
            return 'text';  // Pipeline structures
        }
        if (nextLines.includes('req_') || nextLines.includes('TPX_')) {
            return 'text';  // Request/Token identifiers
        }
        if (nextLines.match(/^\w+\s*[:=]/m)) {
            return 'text';  // Pseudo-code assignments
        }
        if (nextLines.includes('│') || nextLines.includes('┌') || nextLines.includes('└') || nextLines.includes('─') || nextLines.includes('▼') || nextLines.includes('↓')) {
            return 'text';  // ASCII diagrams/flowcharts
        }
        if (nextLines.match(/M\s*=\s*\{/)) {
            return 'text';  // Mathematical set notation
        }

        // Default to text for specifications
        return 'text';
    }

    fixTableColumns(content) {
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect table rows (contain | but not in code blocks)
            if (line.includes('|') && !line.trim().startsWith('```')) {
                // Fix spacing around pipes
                const parts = line.split('|');
                const fixed = parts.map((cell, idx) => {
                    const trimmed = cell.trim();

                    // Handle empty cells at start/end
                    if (idx === 0 && trimmed === '') return '';
                    if (idx === parts.length - 1 && trimmed === '') return '';

                    // Add proper spacing
                    return ` ${trimmed} `;
                }).join('|');

                result.push(fixed);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    fixEmphasisAsHeading(content) {
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect standalone bold text that should be a heading
            if (line.match(/^\*\*[A-Z][^*]+\*\*\s*$/) &&
                (i === 0 || lines[i - 1].trim() === '')) {
                const text = line.replace(/\*\*/g, '').trim();
                result.push(`### ${text}`);
                console.log(`  Converted emphasis to heading: ${text}`);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    fixTrailingPunctuation(content) {
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect headings with trailing punctuation (except . which is OK)
            if (line.match(/^#{1,6}\s+.+[:]$/)) {
                const fixed = line.replace(/:$/, '');
                result.push(fixed);
                console.log(`  Removed trailing punctuation from heading`);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    fixListIndentation(content) {
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect list items with inconsistent indentation
            const listMatch = line.match(/^(\s+)([-*+])\s+/);
            if (listMatch) {
                const indent = listMatch[1];
                const marker = listMatch[2];

                // Normalize to multiples of 2 spaces
                const spaces = indent.length;
                const normalizedSpaces = Math.floor(spaces / 2) * 2;

                if (spaces !== normalizedSpaces) {
                    const fixed = ' '.repeat(normalizedSpaces) + marker + line.substring(indent.length + marker.length + 1);
                    result.push(fixed);
                    console.log(`  Fixed list indentation at line ${i + 1}`);
                } else {
                    result.push(line);
                }
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    fixTrailingSpaces(content) {
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Remove trailing spaces (except 2 spaces for hard line breaks in markdown)
            const trailingSpaces = line.match(/\s+$/);
            if (trailingSpaces) {
                const count = trailingSpaces[0].length;

                // Keep exactly 2 spaces for hard breaks, remove others
                if (count === 2) {
                    result.push(line); // Already correct
                } else {
                    const fixed = line.trimEnd();
                    result.push(fixed);
                    console.log(`  Removed ${count} trailing spaces at line ${i + 1}`);
                }
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    fixAll() {
        console.log('🔧 Markdown Lint Auto-Fixer v2\n');
        console.log(`Processing ${MARKDOWN_FILES.length} files...\n`);

        MARKDOWN_FILES.forEach(file => this.fixFile(file));

        console.log(`\n✨ Complete! Fixed ${this.fixCount} files.`);
    }
}

// Run fixer
if (require.main === module) {
    const fixer = new MarkdownLintFixer(process.cwd());
    fixer.fixAll();
}

module.exports = MarkdownLintFixer;
