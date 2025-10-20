/**
 * Update all fallback object signatures to accept variadic arguments
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function fixFile(filePath) {
    console.log(`Fixing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix all log function signatures in fallback objects
    const patterns = [
        {
            from: /(\s+)(debugLog|logDebug|logInfo|logWarn|logError): \(msg: string\) => console\.(log|info|warn|error)\(/g,
            to: '$1$2: (msg: string, ...args: any[]) => console.$3('
        }
    ];

    patterns.forEach(({from, to}) => {
        if (from.test(content)) {
            content = content.replace(from, to);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('  ✓ Fixed');
    } else {
        console.log('  - No changes');
    }
}

function main() {
    const files = fs.readdirSync(srcDir)
        .filter(f => f.endsWith('.ts'))
        .map(f => path.join(srcDir, f));

    console.log(`Found ${files.length} TypeScript files\n`);

    files.forEach(fixFile);

    console.log('\nDone!');
}

main();
