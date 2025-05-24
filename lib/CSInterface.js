/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright 2014 Adobe Inc.
 * All Rights Reserved.
 *
 * NOTICE: Adobe permits you to use, modify, and distribute this file in
 * accordance with the terms of the Adobe license agreement accompanying
 * it. If you have received this file from a source other than Adobe,
 * then your use, modification, or distribution of it requires the prior
 * written permission of Adobe.
 **************************************************************************/

/**
 * CSInterface - CEP 라이브러리 핵심 요약 버전
 * Adobe Creative Cloud 애플리케이션과 HTML 확장 간의 통신 인터페이스
 */
function CSInterface() {
    this.hostEnvironment = JSON.parse(
        window.__adobe_cep__.getHostEnvironment()
    );
    this.appName = this.hostEnvironment.appName;
    this.appVersion = this.hostEnvironment.appVersion;
    this.appLocale = this.hostEnvironment.appLocale;
    this.appUILocale = this.hostEnvironment.appUILocale;
    this.appId = this.hostEnvironment.appId;
}

/**
 * ExtendScript 코드를 실행합니다.
 * @param script ExtendScript 코드.
 * @param callback 콜백 함수. 실행 결과를 처리합니다.
 */
CSInterface.prototype.evalScript = function (script, callback) {
    if (callback === null || callback === undefined) {
        callback = function (result) {};
    }
    window.__adobe_cep__.evalScript(script, callback);
};

/**
 * 이벤트 리스너를 등록합니다.
 * @param type 이벤트 타입.
 * @param listener 이벤트 리스너 함수.
 * @param obj 선택적인 컨텍스트 객체.
 */
CSInterface.prototype.addEventListener = function (type, listener, obj) {
    window.__adobe_cep__.addEventListener(type, listener, obj);
};

/**
 * 이벤트 리스너를 제거합니다.
 * @param type 이벤트 타입.
 * @param listener 이벤트 리스너 함수.
 * @param obj 선택적인 컨텍스트 객체.
 */
CSInterface.prototype.removeEventListener = function (type, listener, obj) {
    window.__adobe_cep__.removeEventListener(type, listener, obj);
};

/**
 * 확장 프로그램 ID를 가져옵니다.
 * @return 확장 프로그램 ID.
 */
CSInterface.prototype.getExtensionID = function () {
    return window.__adobe_cep__.getExtensionId();
};

/**
 * 디버그 모드에서 실행 중인지 확인합니다.
 * @return 디버그 모드이면 true, 아니면 false.
 */
CSInterface.prototype.isDebug = function () {
    return true;
};

// CSXSEvent 클래스
function CSXSEvent() {
    this.type = null;
    this.data = null;
    this.scope = null;
    this.appId = null;
    this.extensionId = null;
}

/**
 * 이벤트를 발송합니다.
 */
CSXSEvent.prototype.dispatch = function () {
    if (this.type && this.type.length > 0) {
        try {
            var typeID = this.type;
            window.__adobe_cep__.dispatchEvent(typeID, JSON.stringify(this));
        } catch (e) {
            console.error("CSXSEvent.dispatch 오류: ", e);
        }
    }
};
