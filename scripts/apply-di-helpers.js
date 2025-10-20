const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

// Files to process (excluding already done: event-manager, communication, app)
const filesToProcess = [
    'ui-manager.ts',
    'state-manager.ts',
    'error-handler.ts',
    'sound-engine.ts',
    'audio-file-processor.ts',
    'clip-time-calculator.ts',
    'audio-preview-manager.ts',
    'text-processor.ts'
];

filesToProcess.forEach(fileName => {
    const filePath = path.join(srcDir, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping ${fileName} (not found)`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern 1: Replace DI initialization block
    const diInitPattern = /\/\/ DI 컨테이너에서 의존성 가져오기.*?\n.*?let diContainer:.*?\n.*?let utilsService:.*?\n.*?let uiService:.*?\n.*?(?:let errorService:.*?\n.*?)?(?:let stateService:.*?\n.*?)?.*?try \{[\s\S]*?\} catch \(e\) \{[\s\S]*?\}/m;
    
    if (diInitPattern.test(content)) {
        content = content.replace(diInitPattern, `// DIHelpers 사용 - 반복 코드 제거!\n    const DIHelpers = (window as any).DIHelpers;`);
        modified = true;
        console.log(`✅ ${fileName}: Replaced DI initialization`);
    }

    // Pattern 2: Update getUtils() function
    const getUtilsPattern = /function getUtils\(\): JSCUtilsInterface \{[\s\S]*?return (?:utilsService \|\| )?window\.JSCUtils \|\| fallback;?\s*\}/;
    
    if (getUtilsPattern.test(content)) {
        const moduleName = fileName.replace('.ts', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        const replacement = `function getUtils(): JSCUtilsInterface {
        if (DIHelpers && DIHelpers.getUtils) {
            return DIHelpers.getUtils('${moduleName}');
        }
        // Fallback
        const fallback: JSCUtilsInterface = {
            debugLog: (msg: string, ..._args: any[]) => console.log('[${moduleName}]', msg),
            logDebug: (msg: string, ..._args: any[]) => console.log('[${moduleName}]', msg),
            logInfo: (msg: string, ..._args: any[]) => console.info('[${moduleName}]', msg),
            logWarn: (msg: string, ..._args: any[]) => console.warn('[${moduleName}]', msg),
            logError: (msg: string, ..._args: any[]) => console.error('[${moduleName}]', msg),
            isValidPath: (path: string) => !!path,
            getShortPath: (path: string) => path,
            safeJSONParse: (str: string) => {
                try { return JSON.parse(str); }
                catch(e) { return null; }
            },
            saveToStorage: (key: string, value: string) => { localStorage.setItem(key, value); return true; },
            loadFromStorage: (key: string) => localStorage.getItem(key),
            removeFromStorage: (key: string) => { localStorage.removeItem(key); return true; },
            CONFIG: {
                DEBUG_MODE: false,
                SOUND_FOLDER_KEY: 'soundInserter_folder',
                APP_NAME: 'JSCEditHelper',
                VERSION: '1.0.0'
            },
            LOG_LEVELS: {} as any,
            log: () => {},
            getDIStatus: () => ({ isDIAvailable: false, containerInfo: 'Fallback mode' })
        };
        return (window.JSCUtils || fallback) as JSCUtilsInterface;
    }`;
        
        content = content.replace(getUtilsPattern, replacement);
        modified = true;
        console.log(`✅ ${fileName}: Updated getUtils()`);
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`💾 ${fileName}: Saved changes`);
    } else {
        console.log(`⏭️  ${fileName}: No changes needed`);
    }
});

console.log('\n✅ DIHelpers application complete!');
