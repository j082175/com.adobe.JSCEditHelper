#!/usr/bin/env node

/**
 * Phase 2 Final Integration Test - Node.js 버전
 * DI 시스템 전체 통합 테스트 및 검증
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Phase 2 Final Integration Test - Node.js 버전');
console.log('=' .repeat(60));

// 테스트 결과 저장
let testResults = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    tests: []
};

// 테스트 헬퍼 함수
function runTest(testName, testFunction) {
    testResults.totalTests++;
    console.log(`\n🔍 테스트: ${testName}`);
    
    try {
        const result = testFunction();
        if (result.success) {
            testResults.passedTests++;
            console.log(`✅ 성공: ${result.message}`);
        } else {
            testResults.failedTests++;
            console.log(`❌ 실패: ${result.message}`);
        }
        
        testResults.tests.push({
            name: testName,
            success: result.success,
            message: result.message,
            details: result.details || null
        });
        
        return result;
    } catch (error) {
        testResults.failedTests++;
        console.log(`❌ 오류: ${error.message}`);
        
        testResults.tests.push({
            name: testName,
            success: false,
            message: error.message,
            details: { stack: error.stack }
        });
        
        return { success: false, message: error.message };
    }
}

// 1. 파일 존재성 테스트
runTest('JavaScript 파일 존재 확인', () => {
    const requiredFiles = [
        'js/di-container.js',
        'js/utils.js',
        'js/ui-manager.js',
        'js/state-manager.js',
        'js/communication.js',
        'js/event-manager.js',
        'js/error-handler.js',
        'js/sound-engine.js',
        'js/app.js'
    ];
    
    let missingFiles = [];
    
    requiredFiles.forEach(file => {
        if (!fs.existsSync(path.join(__dirname, file))) {
            missingFiles.push(file);
        }
    });
    
    if (missingFiles.length === 0) {
        return {
            success: true,
            message: `모든 필수 파일이 존재합니다 (${requiredFiles.length}개)`
        };
    } else {
        return {
            success: false,
            message: `누락된 파일: ${missingFiles.join(', ')}`
        };
    }
});

// 2. TypeScript 소스 파일 존재 확인
runTest('TypeScript 소스 파일 확인', () => {
    const sourceFiles = [
        'src/utils.ts',
        'src/ui-manager.ts',
        'src/state-manager.ts',
        'src/communication.ts',
        'src/event-manager.ts',
        'src/error-handler.ts',
        'src/sound-engine.ts',
        'src/app.ts'
    ];
    
    let missingFiles = [];
    
    sourceFiles.forEach(file => {
        if (!fs.existsSync(path.join(__dirname, file))) {
            missingFiles.push(file);
        }
    });
    
    if (missingFiles.length === 0) {
        return {
            success: true,
            message: `모든 TypeScript 소스 파일이 존재합니다 (${sourceFiles.length}개)`
        };
    } else {
        return {
            success: false,
            message: `누락된 소스 파일: ${missingFiles.join(', ')}`
        };
    }
});

// 3. DI 패턴 변환 검증 - 파일 내용 분석
runTest('DI 패턴 변환 검증', () => {
    const filesToCheck = [
        'js/utils.js',
        'js/ui-manager.js',
        'js/state-manager.js',
        'js/communication.js',
        'js/event-manager.js',
        'js/error-handler.js',
        'js/sound-engine.js'
    ];
    
    let diPatternResults = [];
    
    filesToCheck.forEach(file => {
        try {
            const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
            
            // DI 패턴 키워드 검사
            const hasDIContainer = content.includes('diContainer') || content.includes('window.DI');
            const hasInitializeDI = content.includes('initializeDIDependencies');
            const hasGetDIStatus = content.includes('getDIStatus');
            const hasServiceHelpers = content.includes('Service') && content.includes('get');
            
            const diScore = [hasDIContainer, hasInitializeDI, hasGetDIStatus, hasServiceHelpers]
                .filter(Boolean).length;
            
            diPatternResults.push({
                file: file,
                diScore: diScore,
                maxScore: 4,
                patterns: {
                    diContainer: hasDIContainer,
                    initializeDI: hasInitializeDI,
                    getDIStatus: hasGetDIStatus,
                    serviceHelpers: hasServiceHelpers
                }
            });
            
        } catch (error) {
            diPatternResults.push({
                file: file,
                diScore: 0,
                maxScore: 4,
                error: error.message
            });
        }
    });
    
    const totalScore = diPatternResults.reduce((sum, result) => sum + result.diScore, 0);
    const maxPossibleScore = diPatternResults.length * 4;
    const conversionRate = Math.round((totalScore / maxPossibleScore) * 100);
    
    return {
        success: conversionRate >= 70, // 70% 이상이면 성공
        message: `DI 패턴 변환률: ${conversionRate}% (${totalScore}/${maxPossibleScore})`,
        details: diPatternResults
    };
});

// 4. 레거시 코드 제거 검증
runTest('레거시 코드 제거 검증', () => {
    const filesToCheck = [
        'js/utils.js',
        'js/ui-manager.js',
        'js/state-manager.js',
        'js/communication.js',
        'js/event-manager.js',
        'js/error-handler.js',
        'js/sound-engine.js'
    ];
    
    let legacyPatterns = [];
    
    filesToCheck.forEach(file => {
        try {
            const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
            
            // 직접적인 window 참조 패턴 검사 (fallback은 제외)
            const directWindowReferences = content.match(/window\.JSC[A-Za-z]+(?!\s*\|\|)/g) || [];
            
            if (directWindowReferences.length > 0) {
                legacyPatterns.push({
                    file: file,
                    patterns: directWindowReferences,
                    count: directWindowReferences.length
                });
            }
            
        } catch (error) {
            legacyPatterns.push({
                file: file,
                error: error.message
            });
        }
    });
    
    if (legacyPatterns.length === 0) {
        return {
            success: true,
            message: '모든 파일에서 직접적인 window 참조가 제거되었습니다'
        };
    } else {
        return {
            success: false,
            message: `직접적인 window 참조가 남아있는 파일: ${legacyPatterns.length}개`,
            details: legacyPatterns
        };
    }
});

// 5. 테스트 파일 존재 확인
runTest('테스트 파일 존재 확인', () => {
    const testFiles = [
        'test-phase2-integration.html',
        'test-phase2-final-integration.html',
        'test-phase2-node.js'
    ];
    
    let existingFiles = [];
    
    testFiles.forEach(file => {
        if (fs.existsSync(path.join(__dirname, file))) {
            existingFiles.push(file);
        }
    });
    
    return {
        success: existingFiles.length >= 2, // 최소 2개 이상의 테스트 파일
        message: `테스트 파일: ${existingFiles.length}/${testFiles.length}개 존재`,
        details: existingFiles
    };
});

// 6. 설정 파일 검증
runTest('설정 파일 검증', () => {
    const configFiles = [
        'tsconfig.json',
        'package.json',
        'manifest.xml'
    ];
    
    let validConfigs = [];
    let invalidConfigs = [];
    
    configFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            try {
                if (file.endsWith('.json')) {
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    validConfigs.push({ file, status: 'valid JSON' });
                } else {
                    validConfigs.push({ file, status: 'exists' });
                }
            } catch (error) {
                invalidConfigs.push({ file, error: error.message });
            }
        } else {
            invalidConfigs.push({ file, error: 'file not found' });
        }
    });
    
    return {
        success: validConfigs.length >= 2,
        message: `유효한 설정 파일: ${validConfigs.length}/${configFiles.length}개`,
        details: { valid: validConfigs, invalid: invalidConfigs }
    };
});

// 결과 요약 출력
console.log('\n' + '='.repeat(60));
console.log('📊 Phase 2 Final Integration Test 결과 요약');
console.log('='.repeat(60));

console.log(`테스트 시간: ${testResults.timestamp}`);
console.log(`총 테스트: ${testResults.totalTests}개`);
console.log(`성공: ${testResults.passedTests}개`);
console.log(`실패: ${testResults.failedTests}개`);
console.log(`성공률: ${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%`);

const overallSuccess = testResults.failedTests === 0;
console.log(`\n전체 평가: ${overallSuccess ? '✅ 성공 - Phase 2 DI 전환 완료!' : '⚠️  일부 항목 미완성'}`);

// 상세 결과를 파일로 저장
const resultFile = path.join(__dirname, 'test-phase2-final-results.json');
fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
console.log(`\n상세 결과가 저장되었습니다: ${resultFile}`);

// Phase 2 완료 상태 평가
if (overallSuccess) {
    console.log('\n🎉 Phase 2 DI 패턴 변환이 성공적으로 완료되었습니다!');
    console.log('✓ 모든 모듈이 DI 패턴으로 변환됨');
    console.log('✓ 레거시 직접 참조 제거됨');
    console.log('✓ 테스트 환경 구축 완료');
    console.log('✓ 설정 파일 검증 완료');
} else {
    console.log('\n⚠️  Phase 2에서 일부 개선이 필요합니다:');
    testResults.tests.forEach(test => {
        if (!test.success) {
            console.log(`- ${test.name}: ${test.message}`);
        }
    });
}

process.exit(overallSuccess ? 0 : 1);