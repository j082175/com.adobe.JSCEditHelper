/**
 * JSCEditHelper 전용 글로벌 타입 정의
 * 프로젝트 전체에서 사용하는 인터페이스와 타입들
 */

// =============================================================================
// Core Module Interfaces
// =============================================================================

interface JSCUtilsInterface {
    debugLog(message: string, ...args: any[]): void;
    logDebug(message: string, ...args: any[]): void;
    logInfo(message: string, ...args: any[]): void;
    logWarn(message: string, ...args: any[]): void;
    logError(message: string, ...args: any[]): void;
    isValidPath(path: string): boolean;
    getShortPath(path: string): string;
    safeJSONParse(json: string): any;
    CONFIG: {
        DEBUG_MODE: boolean;
    };
}

interface JSCUIManagerInterface {
    updateStatus(message: string, isSuccess: boolean): void;
    updateThemeWithAppSkinInfo(csInterface: any): void;
    displaySoundList(files: string[]): void;
    updateSoundButtons(files: any[], folderPath: string): void;
    showDebugInfo(): void;
    toggleDebugButton(show: boolean): void;
    resetDebugUI(): void;
    updateMagnetStatus(success: boolean, clipsMoved?: number, gapsRemoved?: number): void;
}

interface JSCStateManagerInterface {
    initializeFolderPath(): void;
    saveFolderPath(path: string): void;
    getCurrentFolderPath(): string;
    clearFolderPath(): void;
    validateState(): { isValid: boolean; errors: string[] };
    getSettings(): {
        folderPath: string;
        audioTrack: string | number;
    };
}

interface JSCCommunicationInterface {
    initialize(): any;
    callExtendScript(script: string, callback?: (result: string) => void): void;
    callExtendScriptAsync(script: string): Promise<string>;
    getCSInterface(): any;
    getDIStatus(): any;
}

interface JSCEventManagerInterface {
    setupEventListeners(): void;
    handleSoundFileButtonClick(event: Event): void;
}

interface JSCErrorHandlerInterface {
    readonly ERROR_TYPES: any;
    readonly ERROR_SEVERITY: any;
    createError(type: any, code: string, message?: string, details?: any): any;
    handleError(error: any, showToUser?: boolean): any;
    handleValidationError(code: string, customMessage?: string, details?: any): any;
    handleCommunicationError(code: string, customMessage?: string, details?: any): any;
    handleFileSystemError(code: string, customMessage?: string, details?: any): any;
    handleUserInputError(code: string, customMessage?: string, details?: any): any;
    safeExecute<T>(fn: () => T, errorMessage?: string, errorType?: any): T | null;
    handleAsyncError(error: Error, context?: string): any;
    getDIStatus(): any;
}

interface JSCAppInterface {
    initialize(): boolean;
    _initialized?: boolean;
}

// =============================================================================
// TypeScript Engine Interfaces
// =============================================================================

interface SoundEngineInterface {
    executeSoundInsertion(config: SoundEngineConfig): Promise<SoundEngineResult>;
    executeMagnetClips(): Promise<SoundEngineResult>;
    getEngineStatus(): { isReady: boolean; dependencies: string[] };
}

interface ClipTimeCalculatorInterface {
    sortClipsByTime(clips: ClipInfo[]): ClipInfo[];
    analyzeClipGaps(clips: ClipInfo[]): ClipGap[];
    createInsertionPlan(clips: ClipInfo[], audioFiles: string[], targetAudioTrack?: number): InsertionPlan;
    createMagnetPlan(clips: ClipInfo[]): MagnetPlan;
    createTimeCode(seconds: number): TimeCode;
    ticksToTimeCode(ticks: number): TimeCode;
    addTime(time1: TimeCode, time2: TimeCode): TimeCode;
    subtractTime(time1: TimeCode, time2: TimeCode): TimeCode;
    validateClipInfo(clip: any): ClipInfo | null;
    formatDuration(timeCode: TimeCode): string;
}

interface AudioFileProcessorInterface {
    processAudioFolder(config: AudioProcessingConfig): AudioFolderResult;
    hasDefaultPrefix(fileName: string): boolean;
    isSupportedAudioFile(fileName: string, extensions?: string[]): boolean;
    filterAudioFiles(files: AudioFileInfo[], config: AudioProcessingConfig): AudioFileInfo[];
    createAudioFileInfo(filePath: string, fileName: string): AudioFileInfo;
    formatFileSize(bytes: number): string;
}

// =============================================================================
// Data Type Interfaces (imported from modules)
// =============================================================================

interface SoundEngineConfig {
    folderPath: string;
    audioTrack: string | number;
    filterByDefaultPrefix?: boolean;
    excludePatterns?: string[];
    maxInsertions?: number;
}

interface SoundEngineResult {
    success: boolean;
    message: string;
    data?: any;
    debug?: string;
    debugLog?: string;
    executionTime?: number;
}

interface TimeCode {
    ticks: number;
    seconds: number;
    timecode?: string;
}

interface ClipInfo {
    id: string;
    name: string;
    start: TimeCode;
    end: TimeCode;
    duration: TimeCode;
    trackIndex: number;
    trackType: 'video' | 'audio';
    selected: boolean;
}

interface ClipGap {
    startTime: TimeCode;
    endTime: TimeCode;
    duration: TimeCode;
    beforeClip: ClipInfo;
    afterClip: ClipInfo;
    gapIndex: number;
}

interface InsertionPlan {
    insertions: ClipInsertion[];
    totalInsertions: number;
    audioTrack: number;
    estimatedDuration: TimeCode;
}

interface ClipInsertion {
    position: TimeCode;
    audioFile: string;
    targetTrack: number;
    beforeClip?: ClipInfo;
    afterClip?: ClipInfo;
    insertionType: 'between' | 'before' | 'after' | 'overlay';
    clipDuration?: TimeCode;
}

interface MagnetPlan {
    movements: ClipMovement[];
    totalMoved: number;
    gapsRemoved: number;
    estimatedTime: number;
}

interface ClipMovement {
    clip: ClipInfo;
    fromPosition: TimeCode;
    toPosition: TimeCode;
    deltaTime: TimeCode;
}

interface AudioFileInfo {
    name: string;
    fsName: string;
    displayName: string;
    extension: string;
    size?: number;
}

interface AudioFolderResult {
    files: AudioFileInfo[];
    path: string;
    totalFiles: number;
    filteredCount: number;
}

interface AudioProcessingConfig {
    folderPath: string;
    filterByDefaultPrefix: boolean;
    supportedExtensions?: string[];
    excludePatterns?: string[];
}

// =============================================================================
// Global Window Interface Extensions
// =============================================================================

declare global {
    interface Window {
        // Core Modules
        JSCUtils?: JSCUtilsInterface;
        JSCUIManager?: JSCUIManagerInterface;
        JSCStateManager?: JSCStateManagerInterface;
        JSCCommunication?: JSCCommunicationInterface;
        JSCEventManager?: JSCEventManagerInterface;
        JSCErrorHandler?: JSCErrorHandlerInterface;
        JSCApp?: JSCAppInterface;
        
        // TypeScript Engines
        SoundEngine?: SoundEngineInterface;
        ClipTimeCalculator?: ClipTimeCalculatorInterface;
        AudioFileProcessor?: AudioFileProcessorInterface;
        
        // Debug and State
        lastDebugInfo?: string;
    }
}

export {};