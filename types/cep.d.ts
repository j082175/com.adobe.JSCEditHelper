/**
 * Adobe CEP (Common Extensibility Platform) Type Definitions
 * CEP 11.0 기반
 */

declare global {
  interface Window {
    JSCUtils?: any;
    JSCUIManager?: any;
    JSCStateManager?: any;
    JSCCommunication?: any;
    JSCEventManager?: any;
    JSCErrorHandler?: any;
    JSCApp?: any;
    
    // TypeScript 엔진들
    SoundEngine?: any;
    ClipTimeCalculator?: any;
    AudioFileProcessor?: any;
    
    // 디버그 및 상태 정보
    lastDebugInfo?: string;
  }
  
  // 글로벌 CSInterface 타입 선언
  var CSInterface: {
    new(): CSInterface;
    THEME_COLOR_CHANGED_EVENT: string;
  };
}

// CSInterface 클래스
declare class CSInterface {
  constructor();
  
  // 기본 메서드
  evalScript(script: string, callback?: (result: string) => void): void;
  addEventListener(type: string, listener: (event: CSEvent) => void): void;
  removeEventListener(type: string, listener: (event: CSEvent) => void): void;
  requestOpenExtension(extensionId: string, params?: string): void;
  closeExtension(): void;
  
  // 환경 정보
  hostEnvironment: HostEnvironment;
  
  // 시스템 정보
  getSystemPath(pathType: SystemPath): string;
  getOSInformation(): string;
  openURLInDefaultBrowser(url: string): void;
  
  // 테마
  requestThemeColor(skinInfo: AppSkinInfo): void;
  registerInvalidCertificateCallback(callback: () => void): void;
  registerKeyEventsInterest(keyEvents: string): void;
  
  // 확장 정보
  getExtensions(extensionIds?: string[]): Extension[];
  getNetworkPreferences(): NetworkPreferences;
  
  // 파일 시스템
  initResourceBundle(path: string, locale: string): void;
}

// CSEvent 인터페이스
interface CSEvent {
  type: string;
  scope: string;
  appId?: string;
  extensionId?: string;
  data?: any;
}

// 호스트 환경 정보
interface HostEnvironment {
  appId: string;
  appVersion: string;
  appLocale: string;
  appUILocale: string;
  appSkinInfo: AppSkinInfo;
  isAppOnline: boolean;
}

// 앱 스킨 정보
interface AppSkinInfo {
  baseFontFamily: string;
  baseFontSize: number;
  appBarBackgroundColor: RGBColor;
  panelBackgroundColor: RGBColor;
  appBarBackgroundColorSRGB: RGBColor;
  panelBackgroundColorSRGB: RGBColor;
  systemHighlightColor: RGBColor;
}

// RGB 색상
interface RGBColor {
  color: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };
}

// 시스템 경로 타입
enum SystemPath {
  USER_DATA = "userData",
  COMMON_FILES = "commonFiles",
  MY_DOCUMENTS = "myDocuments",
  APPLICATION = "application",
  EXTENSION = "extension",
  HOST_APPLICATION = "hostApplication"
}

// 확장 정보
interface Extension {
  id: string;
  name: string;
  mainPath: string;
  basePath: string;
  windowType: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

// 네트워크 환경설정
interface NetworkPreferences {
  proxy: {
    http: ProxySettings;
    https: ProxySettings;
  };
}

interface ProxySettings {
  server: string;
  port: number;
  username: string;
  password: string;
  bypass: string[];
}


export {};