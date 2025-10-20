/**
 * Add 'const utils = getUtils();' to functions that use utils but don't declare it
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function fixFile(filePath) {
    console.log(`Fixing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        newLines.push(line);

        // Check if this is a function declaration
        const isFunctionStart = /^\s*function\s+\w+.*\{$/.test(line) ||
                               /^\s*\w+\s*:\s*function.*\{$/.test(line) ||
                               /^\s*const\s+\w+\s*=\s*function.*\{$/.test(line) ||
                               /^\s*async function\s+\w+.*\{$/.test(line);

        if (isFunctionStart) {
            // Look ahead to see if utils is used in this function
            let usesUtils = false;
            let hasUtilsDeclaration = false;
            let bracketCount = 1;
            let j = i + 1;

            // Scan the function body
            while (j < lines.length && bracketCount > 0) {
                const nextLine = lines[j];

                // Count brackets to find function end
                bracketCount += (nextLine.match(/\{/g) || []).length;
                bracketCount -= (nextLine.match(/\}/g) || []).length;

                // Check if utils is used
                if (/\butils\.(log|debug|warn|error|info|is|get|save|load|remove|safe|CONFIG)/.test(nextLine)) {
                    usesUtils = true;
                }

                // Check if utils is already declared
                if (/^\s*const utils = getUtils\(\);/.test(nextLine)) {
                    hasUtilsDeclaration = true;
                }

                j++;
                if (j > i + 200) break; // Safety limit
            }

            // If uses utils but doesn't have declaration, add it
            if (usesUtils && !hasUtilsDeclaration) {
                const indent = line.match(/^\s*/)[0] + '    '; // Add 4 spaces
                newLines.push(indent + 'const utils = getUtils();');
                modified = true;
                console.log(`  Added utils declaration at line ${i + 2}`);
            }
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
        console.log(`  ✓ Fixed`);
    } else {
        console.log(`  - No changes needed`);
    }
}

function main() {
    const files = fs.readdirSync(srcDir)
        .filter(f => f.endsWith('.ts') && f !== 'utils.ts') // Skip utils.ts itself
        .map(f => path.join(srcDir, f));

    console.log(`Found ${files.length} TypeScript files\n`);

    files.forEach(fixFile);

    console.log('\nDone! Run: npx tsc');
}

main();
