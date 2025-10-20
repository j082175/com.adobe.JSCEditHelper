/**
 * Script to replace console.* calls with utils.log* calls
 * Run with: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const replacements = [
    // Replace console.log (but not in fallback objects or arrow functions)
    {
        pattern: /^(\s+)console\.log\(/gm,
        replacement: '$1utils.logDebug(',
        description: 'console.log → utils.logDebug'
    },
    {
        pattern: /^(\s+)console\.error\(/gm,
        replacement: '$1utils.logError(',
        description: 'console.error → utils.logError'
    },
    {
        pattern: /^(\s+)console\.warn\(/gm,
        replacement: '$1utils.logWarn(',
        description: 'console.warn → utils.logWarn'
    },
    {
        pattern: /^(\s+)console\.info\(/gm,
        replacement: '$1utils.logInfo(',
        description: 'console.info → utils.logInfo'
    }
];

function processFile(filePath) {
    console.log(`Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changes = [];

    // Skip if file contains fallback object definitions (rough heuristic)
    const lines = content.split('\n');
    const processedLines = lines.map((line, index) => {
        // Skip lines in fallback objects
        if (line.includes('=>') && line.includes('console.')) {
            return line; // Keep fallback definitions unchanged
        }

        let modifiedLine = line;
        for (const {pattern, replacement, description} of replacements) {
            if (pattern.test(modifiedLine)) {
                modifiedLine = modifiedLine.replace(pattern, replacement);
                modified = true;
                changes.push(`Line ${index + 1}: ${description}`);
            }
        }
        return modifiedLine;
    });

    if (modified) {
        const newContent = processedLines.join('\n');

        // Ensure utils is available at the top of functions
        // This is a simple heuristic - may need manual review
        const ensureUtils = (content) => {
            // Add 'const utils = getUtils();' at the start of functions if not present
            // This is simplified - in practice you'd need more sophisticated parsing
            return content;
        };

        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✓ Modified (${changes.length} changes)`);
        changes.forEach(c => console.log(`    - ${c}`));
    } else {
        console.log(`  - No changes needed`);
    }
}

function main() {
    const files = fs.readdirSync(srcDir)
        .filter(f => f.endsWith('.ts'))
        .map(f => path.join(srcDir, f));

    console.log(`Found ${files.length} TypeScript files\n`);

    files.forEach(processFile);

    console.log('\nDone! Please review changes and run: npx tsc');
}

main();
