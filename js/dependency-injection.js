"use strict";
/**
 * Dependency Injection Container
 * 안전한 모듈 간 의존성 관리를 위한 컨테이너
 */
var DependencyInjection = (function () {
    'use strict';
    // =============================================================================
    // Dependency Injection Container Implementation
    // =============================================================================
    var DependencyContainer = /** @class */ (function () {
        function DependencyContainer() {
            this.services = new Map();
            this.factories = new Map();
            this.singletons = new Set();
        }
        /**
         * 서비스 팩토리 등록
         */
        DependencyContainer.prototype.register = function (key, factory) {
            this.factories.set(key, factory);
            this.services.delete(key); // 기존 인스턴스 제거
        };
        /**
         * 싱글톤 서비스 등록
         */
        DependencyContainer.prototype.registerSingleton = function (key, factory) {
            this.register(key, factory);
            this.singletons.add(key);
        };
        /**
         * 서비스 인스턴스 획득
         */
        DependencyContainer.prototype.get = function (key) {
            try {
                // 이미 생성된 싱글톤 인스턴스가 있는 경우
                if (this.singletons.has(key) && this.services.has(key)) {
                    return this.services.get(key);
                }
                // 팩토리가 등록되어 있는 경우
                if (this.factories.has(key)) {
                    var factory = this.factories.get(key);
                    var instance = factory();
                    // 싱글톤인 경우 인스턴스 저장
                    if (this.singletons.has(key)) {
                        this.services.set(key, instance);
                    }
                    return instance;
                }
                console.warn("[DI] Service '".concat(key, "' not found in DI container"));
                return null;
            }
            catch (error) {
                console.error("[DI] Error creating service '".concat(key, "':"), error);
                return null;
            }
        };
        /**
         * 서비스 등록 여부 확인
         */
        DependencyContainer.prototype.has = function (key) {
            return this.factories.has(key);
        };
        /**
         * 컨테이너 초기화
         */
        DependencyContainer.prototype.clear = function () {
            this.services.clear();
            this.factories.clear();
            this.singletons.clear();
        };
        /**
         * 등록된 서비스 목록 반환 (디버깅용)
         */
        DependencyContainer.prototype.getRegisteredServices = function () {
            return Array.from(this.factories.keys());
        };
        return DependencyContainer;
    }());
    // =============================================================================
    // Service Locator Pattern (안전한 전역 접근)
    // =============================================================================
    var ServiceLocator = /** @class */ (function () {
        function ServiceLocator() {
            this.container = new DependencyContainer();
        }
        ServiceLocator.getInstance = function () {
            if (!ServiceLocator.instance) {
                ServiceLocator.instance = new ServiceLocator();
            }
            return ServiceLocator.instance;
        };
        /**
         * 서비스 등록
         */
        ServiceLocator.prototype.register = function (key, factory) {
            this.container.register(key, factory);
        };
        /**
         * 싱글톤 서비스 등록
         */
        ServiceLocator.prototype.registerSingleton = function (key, factory) {
            this.container.registerSingleton(key, factory);
        };
        /**
         * 서비스 획득
         */
        ServiceLocator.prototype.get = function (key) {
            return this.container.get(key);
        };
        /**
         * 안전한 서비스 획득 (타입 검증 포함)
         */
        ServiceLocator.prototype.getSafe = function (key, validator) {
            var service = this.get(key);
            if (!service) {
                return null;
            }
            if (validator && !validator(service)) {
                console.warn("[DI] Service '".concat(key, "' failed type validation"));
                return null;
            }
            return service;
        };
        /**
         * 서비스 존재 여부 확인
         */
        ServiceLocator.prototype.has = function (key) {
            return this.container.has(key);
        };
        /**
         * 컨테이너 초기화 (테스트용)
         */
        ServiceLocator.prototype.clear = function () {
            this.container.clear();
        };
        /**
         * 등록된 서비스 목록 (디버깅용)
         */
        ServiceLocator.prototype.getRegisteredServices = function () {
            return this.container.getRegisteredServices();
        };
        ServiceLocator.instance = null;
        return ServiceLocator;
    }());
    // =============================================================================
    // Dependency Injection Helpers
    // =============================================================================
    /**
     * 의존성 주입을 위한 헬퍼 함수들
     */
    var DI = {
        /**
         * 서비스 등록
         */
        register: function (key, factory) {
            ServiceLocator.getInstance().register(key, factory);
        },
        /**
         * 싱글톤 등록
         */
        registerSingleton: function (key, factory) {
            ServiceLocator.getInstance().registerSingleton(key, factory);
        },
        /**
         * 서비스 획득
         */
        get: function (key) {
            return ServiceLocator.getInstance().get(key);
        },
        /**
         * 안전한 서비스 획득
         */
        getSafe: function (key, validator) {
            return ServiceLocator.getInstance().getSafe(key, validator);
        },
        /**
         * 서비스 존재 확인
         */
        has: function (key) {
            return ServiceLocator.getInstance().has(key);
        },
        /**
         * 필수 의존성 검증
         */
        validateDependencies: function (requiredServices) {
            var _this = this;
            var missing = requiredServices.filter(function (service) { return !_this.has(service); });
            return {
                isValid: missing.length === 0,
                missing: missing
            };
        },
        /**
         * 의존성과 함께 모듈 생성
         */
        createWithDependencies: function (factory, requiredDeps) {
            var validation = this.validateDependencies(requiredDeps);
            if (!validation.isValid) {
                console.error('[DI] Missing dependencies:', validation.missing);
                return null;
            }
            var deps = {};
            for (var _i = 0, requiredDeps_1 = requiredDeps; _i < requiredDeps_1.length; _i++) {
                var dep = requiredDeps_1[_i];
                deps[dep] = this.get(dep);
            }
            try {
                return factory(deps);
            }
            catch (error) {
                console.error('[DI] Error creating module with dependencies:', error);
                return null;
            }
        }
    };
    // =============================================================================
    // Service Keys (타입 안전성을 위한 상수)
    // =============================================================================
    var SERVICE_KEYS = {
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
    };
    // =============================================================================
    // Type Guards (타입 검증)
    // =============================================================================
    var TypeGuards = {
        isJSCUtils: function (service) {
            return service &&
                typeof service.debugLog === 'function' &&
                typeof service.isValidPath === 'function';
        },
        isJSCUIManager: function (service) {
            return service &&
                typeof service.updateStatus === 'function' &&
                typeof service.displaySoundList === 'function';
        },
        isJSCStateManager: function (service) {
            return service &&
                typeof service.saveFolderPath === 'function' &&
                typeof service.getCurrentFolderPath === 'function';
        },
        isSoundEngine: function (service) {
            return service &&
                typeof service.executeSoundInsertion === 'function' &&
                typeof service.getEngineStatus === 'function';
        }
    };
    // Public API 반환
    return {
        DI: DI,
        SERVICE_KEYS: SERVICE_KEYS,
        TypeGuards: TypeGuards,
        DependencyContainer: DependencyContainer,
        ServiceLocator: ServiceLocator
    };
})();
// 전역 접근을 위해 window 객체에 노출
if (typeof window !== 'undefined') {
    window.DI = DependencyInjection.DI;
    window.SERVICE_KEYS = DependencyInjection.SERVICE_KEYS;
    window.TypeGuards = DependencyInjection.TypeGuards;
    window.DependencyInjection = DependencyInjection;
}
//# sourceMappingURL=dependency-injection.js.map