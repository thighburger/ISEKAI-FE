/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 * 이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { LAppDelegate } from './lappdelegate';
import * as LAppDefine from './lappdefine';

/**
 * 브라우저 로드 후 처리
 */
window.addEventListener(
  'load',
  (): void => {
    // 1. 앱 엔진 및 하위 시스템(WebGL, WebSocket 등)을 초기화합니다.
    if (!LAppDelegate.getInstance().initialize()) {
      return;
    }

    // 2. 메인 루프를 실행합니다.
    LAppDelegate.getInstance().run();

    /**
     * [브라우저 오디오 정책 대응]
     * 브라우저는 사용자 인터랙션(클릭 등) 없이는 오디오 재생을 차단합니다.
     * 첫 클릭 시 AudioContext를 활성화하도록 설정합니다.
     */
    window.addEventListener('click', () => {
      // WebSocketManager를 통해 AudioManager를 가져와 오디오 재생 컨텍스트를 초기화합니다.
      const audioManager = LAppDelegate.getInstance().getWebSocketManager()?.getAudioManager();
      
      // 실제 오디오 컨텍스트를 생성하거나 Resume 시킵니다.
      audioManager?.initializePlayback(); 
      
      console.log('[App] Audio Context가 사용자의 클릭으로 활성화되었습니다.');
    }, { once: true }); // 단 한 번만 실행되도록 설정
  },
  { passive: true }
);

/**
 * 페이지를 나갈 때 리소스 해제 처리
 */
window.addEventListener(
  'beforeunload',
  (): void => LAppDelegate.releaseInstance(), // 싱글톤 인스턴스 및 관련 리소스를 정리합니다.
  { passive: true }
);