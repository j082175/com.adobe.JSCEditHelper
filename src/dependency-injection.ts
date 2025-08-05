/**
 * Dependency Injection Container
 * 안전한 모듈 간 의존성 관리를 위한 컨테이너
 */

const DependencyInjection = (function() {
    'use strict';

// =============================================================================
// Core Container Interface
// =============================================================================

interface DIContainer {
    register<T>(key: string, factory: () => T): void;
    registerSingleton<T>(key: string, factory: () => T): void;
    get<T>(key: string): T | null;
    has(key: string): boolean;
    clear(): void;
}

interface Dependencies {
    [key: string]: any;
}

// =============================================================================
// Dependency Injection Container Implementation
// =============================================================================

class DependencyContainer implements DIContainer {
    private services: Map<string, any> = new Map();
    private factories: Map<string, () => any> = new Map();
    private singletons: Set<string> = new Set();

    /**
     * 서비스 팩토리 등록
     */
    register<T>(key: string, factory: () => T): void {
        this.factories.set(key, factory);
        this.services.delete(key); // 기존 인스턴스 제거
    }

    /**
     * 싱글톤 서비스 등록
     */
    registerSingleton<T>(key: string, factory: () => T): void {
        this.register(key, factory);
        this.singletons.add(key);
    }

    /**
     * 서비스 인스턴스 획득
     */
    get<T>(key: string): T | null {
        try {
            // 이미 생성된 싱글톤 인스턴스가 있는 경우
            if (this.singletons.has(key) && this.services.has(key)) {
                return this.services.get(key) as T;
            }

            // 팩토리가 등록되어 있는 경우
            if (this.factories.has(key)) {
                const factory = this.factories.get(key)!;
                const instance = factory();

                // 싱글톤인 경우 인스턴스 저장
                if (this.singletons.has(key)) {
                    this.services.set(key, instance);
                }

                return instance as T;
            }

            console.warn(`Service '${key}' not found in DI container`);
            return null;
        } catch (error) {
            console.error(`Error creating service '${key}':`, error);
            return null;
        }
    }

    /**
     * 서비스 등록 여부 확인
     */
    has(key: string): boolean {
        return this.factories.has(key);
    }

    /**
     * 컨테이너 초기화
     */
    clear(): void {
        this.services.clear();
        this.factories.clear();
        this.singletons.clear();
    }

    /**
     * 등록된 서비스 목록 반환 (디버깅용)
     */
    getRegisteredServices(): string[] {
        return Array.from(this.factories.keys());
    }
}

// =============================================================================
// Service Locator Pattern (안전한 전역 접근)
// =============================================================================

class ServiceLocator {
    private static instance: ServiceLocator | null = null;
    private container: DIContainer;

    private constructor() {
        this.container = new DependencyContainer();
    }

    static getInstance(): ServiceLocator {
        if (!ServiceLocator.instance) {
            ServiceLocator.instance = new ServiceLocator();
        }
        return ServiceLocator.instance;
    }

    /**
     * 서비스 등록
     */
    register<T>(key: string, factory: () => T): void {
        this.container.register(key, factory);
    }

    /**
     * 싱글톤 서비스 등록
     */
    registerSingleton<T>(key: string, factory: () => T): void {
        this.container.registerSingleton(key, factory);
    }

    /**
     * 서비스 획득
     */
    get<T>(key: string): T | null {
        return this.container.get<T>(key);
    }

    /**
     * 안전한 서비스 획득 (타입 검증 포함)
     */
    getSafe<T>(key: string, validator?: (service: any) => service is T): T | null {
        const service = this.get<T>(key);
        
        if (!service) {
            return null;
        }

        if (validator && !validator(service)) {
            console.warn(`Service '${key}' failed type validation`);
            return null;
        }

        return service;
    }

    /**
     * 서비스 존재 여부 확인
     */
    has(key: string): boolean {
        return this.container.has(key);
    }

    /**
     * 컨테이너 초기화 (테스트용)
     */
    clear(): void {
        this.container.clear();
    }

    /**
     * 등록된 서비스 목록 (디버깅용)
     */
    getRegisteredServices(): string[] {
        return (this.container as DependencyContainer).getRegisteredServices();
    }
}

// =============================================================================
// Dependency Injection Helpers
// =============================================================================

/**
 * 의존성 주입을 위한 헬퍼 함수들
 */
const DI = {
    /**
     * 서비스 등록
     */
    register<T>(key: string, factory: () => T): void {
        ServiceLocator.getInstance().register(key, factory);
    },

    /**
     * 싱글톤 등록
     */
    registerSingleton<T>(key: string, factory: () => T): void {
        ServiceLocator.getInstance().registerSingleton(key, factory);
    },

    /**
     * 서비스 획득
     */
    get<T>(key: string): T | null {
        return ServiceLocator.getInstance().get<T>(key);
    },

    /**
     * 안전한 서비스 획득
     */
    getSafe<T>(key: string, validator?: (service: any) => service is T): T | null {
        return ServiceLocator.getInstance().getSafe<T>(key, validator);
    },

    /**
     * 서비스 존재 확인
     */
    has(key: string): boolean {
        return ServiceLocator.getInstance().has(key);
    },

    /**
     * 필수 의존성 검증
     */
    validateDependencies(requiredServices: string[]): { isValid: boolean; missing: string[] } {
        const missing = requiredServices.filter(service => !this.has(service));
        return {
            isValid: missing.length === 0,
            missing
        };
    },

    /**
     * 의존성과 함께 모듈 생성
     */
    createWithDependencies<T>(
        factory: (deps: Dependencies) => T,
        requiredDeps: string[]
    ): T | null {
        const validation = this.validateDependencies(requiredDeps);
        
        if (!validation.isValid) {
            console.error('Missing dependencies:', validation.missing);
            return null;
        }

        const deps: Dependencies = {};
        for (const dep of requiredDeps) {
            deps[dep] = this.get(dep);
        }

        try {
            return factory(deps);
        } catch (error) {
            console.error('Error creating module with dependencies:', error);
            return null;
        }
    }
};

// =============================================================================
// Service Keys (타입 안전성을 위한 상수)
// =============================================================================

const SERVICE_KEYS = {
    // Core Services
    UTILS: 'JSCUtils',
    UI_MANAGER: 'JSCUIManager', 
    STATE_MANAGER: 'JSCStateManager',
    COMMUNICATION: 'JSCCommunication',
    EVENT_MANAGER: 'JSCEventManager',
    ERROR_HANDLER: 'JSCErrorHandler',
    
    // Engine Services
    SOUND_ENGINE: 'SoundEngine',
    CLIP_TIME_CALCULATOR: 'ClipTimeCalculator',
    AUDIO_FILE_PROCESSOR: 'AudioFileProcessor',
    
    // Future Services (확장용)
    VIDEO_PROCESSOR: 'VideoProcessor',
    SETTINGS_MANAGER: 'SettingsManager',
    PLUGIN_MANAGER: 'PluginManager'
} as const;

// =============================================================================
// Type Guards (타입 검증)
// =============================================================================

const TypeGuards = {
    isJSCUtils(service: any): service is JSCUtilsInterface {
        return service && 
               typeof service.debugLog === 'function' &&
               typeof service.isValidPath === 'function';
    },

    isJSCUIManager(service: any): service is JSCUIManagerInterface {
        return service && 
               typeof service.updateStatus === 'function' &&
               typeof service.displaySoundList === 'function';
    },

    isJSCStateManager(service: any): service is JSCStateManagerInterface {
        return service && 
               typeof service.saveFolderPath === 'function' &&
               typeof service.getCurrentFolderPath === 'function';
    },

    isSoundEngine(service: any): service is any {
        return service && 
               typeof service.executeSoundInsertion === 'function' &&
               typeof service.getEngineStatus === 'function';
    }
};

    // Public API 반환
    return {
        DI,
        SERVICE_KEYS,
        TypeGuards,
        DependencyContainer,
        ServiceLocator
    };
})();

// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    (window as any).DI = DependencyInjection.DI;
    (window as any).SERVICE_KEYS = DependencyInjection.SERVICE_KEYS;
    (window as any).TypeGuards = DependencyInjection.TypeGuards;
    (window as any).DependencyInjection = DependencyInjection;
}