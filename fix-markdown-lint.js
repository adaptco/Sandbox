#!/usr/bin/env node

/**
 * Markdown Lint Auto-Fixer
 * Fixes MD040 (fenced-code-language) and MD060 (table-column-style) issues
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

        // Fix MD024: Handle duplicate headings (context-aware)
        content = this.fixDuplicateHeadings(content, filename);

        // Fix MD036: Emphasis as heading
        content = this.fixEmphasisAsHeading(content);

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✅ Fixed ${filename}`);
            this.fixCount++;
        } else {
            console.log(`✨ No changes needed for ${filename}`);
        }
    }

    fixFencedCodeBlocks(content, filename) {
        // Pattern: ``` without language specifier followed by newline
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect bare ``` at start of line
            if (line.trim() === '```') {
                // Check if it's a closing fence (previous fence was opening)
                let isClosing = false;
                for (let j = i - 1; j >= 0; j--) {
                    if (lines[j].trim().startsWith('```')) {
                        isClosing = true;
                        break;
                    }
                }

                if (!isClosing) {
                    // It's an opening fence without language - infer from context
                    const lang = this.inferLanguage(lines, i, filename);
                    result.push('```' + lang);
                    console.log(`  Fixed code block at line ${i + 1}: added language '${lang}'`);
                } else {
                    result.push(line);
                }
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    inferLanguage(lines, fenceIndex, filename) {
        // Look ahead to infer language
        const nextLines = lines.slice(fenceIndex + 1, fenceIndex + 5).join('\n');

        // Check for common patterns
        if (nextLines.includes('TokenPixel') || nextLines.includes('StateVector')) {
            return 'text';  // Pseudo-code/structure definitions
        }
        if (nextLines.includes('DISTRICT') || nextLines.includes('req_')) {
            return 'text';  // Pipeline/request structures
        }
        if (nextLines.match(/^\w+ = /m)) {
            return 'text';  // Mathematical notation
        }
        if (nextLines.includes('│') || nextLines.includes('┌') || nextLines.includes('└')) {
            return 'text';  // ASCII diagrams
        }

        // Default to text for specifications
        return 'text';
    }

    fixTableColumns(content) {
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect table rows (contain |)
            if (line.includes('|') && !line.trim().startsWith('```')) {
                // Fix spacing around pipes
                const fixed = line
                    .split('|')
                    .map((cell, idx, arr) => {
                        // Trim cell content
                        const trimmed = cell.trim();

                        // Skip empty cells at start/end
                        if (idx === 0 && trimmed === '') return '';
                        if (idx === arr.length - 1 && trimmed === '') return '';

                        // Add space padding
                        return ` ${trimmed} `;
                    })
                    .join('|');

                result.push(fixed);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    fixDuplicateHeadings(content, filename) {
        // For CHECKPOINTING_RITUAL.md, duplicate "Steps" headings are in different sections
        // We'll leave these as-is since they're contextually different
        // Markdown linters don't always understand document structure
        return content;
    }

    fixEmphasisAsHeading(content) {
        // Fix **Bold text** that should be headings
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect standalone bold text that looks like a heading
            if (line.match(/^\*\*[A-Z][^*]+\*\*\s*$/) &&
                (i === 0 || lines[i - 1].trim() === '')) {
                // Convert to heading
                const text = line.replace(/\*\*/g, '').trim();
                result.push(`### ${text}`);
                console.log(`  Converted emphasis to heading: ${text}`);
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    fixAll() {
        console.log('🔧 Markdown Lint Auto-Fixer\n');
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
