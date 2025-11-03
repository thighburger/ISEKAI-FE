/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */
import { csmVector } from '@framework/type/csmvector';
import { CubismFramework, Option } from '@framework/live2dcubismframework';
import * as LAppDefine from './lappdefine';
import { LAppPal } from './lapppal';
import { LAppSubdelegate } from './lappsubdelegate';
import { CubismLogError } from '@framework/utils/cubismdebug';
import { WebSocketManager } from './websocket/websocketmanager';

export let s_instance: LAppDelegate = null;

/**
 * 응용 프로그램 클래스.
 * Cubism SDK 관리.
 */
export class LAppDelegate { 
  /**
   * 클래스의 인스턴스 (싱글 톤)를 반환합니다.
   * 인스턴스가 생성되지 않으면 내부적으로 인스턴스를 만듭니다.
   *
   * @return 클래스 인스턴스
   */
  public static getInstance(): LAppDelegate {
    if (s_instance == null) {
      s_instance = new LAppDelegate();
    }

    return s_instance;
  }

  /**
   * 수업의 인스턴스 (싱글 톤)를 해방시킵니다.
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance.release();
    }

    s_instance = null;
  }

  /**
   * 포인터가 활성화 될 때 호출됩니다.
   */
  private onPointerBegan(e: PointerEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointBegan(e.pageX, e.pageY);
    }
  }

  /**
   * 포인터가 움직일 때 호출됩니다.
   */
  private onPointerMoved(e: PointerEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointMoved(e.pageX, e.pageY);
    }
  }

  /**
   * 포인터가 더 이상 활성화되지 않을 때 호출됩니다.
   */
  private onPointerEnded(e: PointerEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointEnded(e.pageX, e.pageY);
    }
  }

  /**
   * 포인터가 취소되었습니다.
   */
  private onPointerCancel(e: PointerEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onTouchCancel(e.pageX, e.pageY);
    }
  }

  /**
   * 캔버스 크기를 조정하고보기를 다시 시작하십시오.
   */
  public onResize(): void {
    for (let i = 0; i < this._subdelegates.getSize(); i++) {
      this._subdelegates.at(i).onResize();
    }
  }

  /**
   * 실행 프로세스.
   */
  public run(): void {
    // 메인 루프
    const loop = (): void => {
      // 인스턴스가 있는지 확인하십시오
      if (s_instance == null) {
        return;
      }

      // 時間更新
      LAppPal.updateTime();

      for (let i = 0; i < this._subdelegates.getSize(); i++) {
        this._subdelegates.at(i).update();
      }

      // 루프에 대한 재귀 호출
      requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * 풀어 주다.
   */
  private release(): void {
    this.releaseEventListener();
    this.releaseSubdelegates();

    if (this._webSocketManager) {
      this._webSocketManager.dispose();
      this._webSocketManager = null;
    }

    // 입체파 SDK를 릴리스합니다
    CubismFramework.dispose();

    this._cubismOption = null;
  }

  /**
   * 이벤트 리스너 잠금을 해제하십시오.
   */
  private releaseEventListener(): void {
    document.removeEventListener('pointerup', this.pointBeganEventListener);
    this.pointBeganEventListener = null;
    document.removeEventListener('pointermove', this.pointMovedEventListener);
    this.pointMovedEventListener = null;
    document.removeEventListener('pointerdown', this.pointEndedEventListener);
    this.pointEndedEventListener = null;
    document.removeEventListener('pointerdown', this.pointCancelEventListener);
    this.pointCancelEventListener = null;

    // 키보드 이벤트 해제
    document.removeEventListener('keydown', this.keyDownEventListener);

    // null 처리
    this.pointBeganEventListener = null;
    this.pointMovedEventListener = null;
    this.pointEndedEventListener = null;
    this.pointCancelEventListener = null;
    this.keyDownEventListener = null;
  }

  /**
   * 잠자리를 자유롭게하십시오
   */
  private releaseSubdelegates(): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().release();
    }

    this._subdelegates.clear();
    this._subdelegates = null;
  }

  /**
   * 앱에 필요한 것을 초기화하십시오.
   */
  public initialize(): boolean {
    // 입체파 초기화 SDK
    this.initializeCubism();

    this.initializeSubdelegates();
    this.initializeEventListener();

    this.initializeEmotionInput(); // 감정 입력창 초기화 로직 호출
    this.initializeWebSocket(); // 웹소켓 초기화 로직 호출
    return true;
  }
  /**
   * 감정 입력창의 이벤트를 설정합니다.
   */
  private initializeEmotionInput(): void {
    const inputElement = document.getElementById('emotion-input') as HTMLInputElement;

    if (inputElement) {
      inputElement.addEventListener('keydown', (e: KeyboardEvent) => {
        // Enter 키를 눌렀고, 입력값이 비어있지 않을 때
        if (e.key === 'Enter' && inputElement.value.trim() !== '') {
          const emotionKeyword = inputElement.value.trim();

          // Live2D 매니저를 가져옵니다.
          const live2DManager = this._subdelegates.at(0)?.getLive2DManager();
          if (live2DManager) {
            // Live2D 매니저의 메서드를 호출하여 감정 표현과 채팅을 동시에 실행합니다.
            live2DManager.startChatWithEmotion(
              '아냐', // 이름
              `"${emotionKeyword}" 표정을 지었다!`, // 표시할 메시지
              emotionKeyword // 사용자가 입력한 감정 키워드
            );
          }

          // 입력창을 비웁니다.
          inputElement.value = '';
        }
      });
    }
  }
  /**
   * 이벤트 리스너를 설정하십시오.
   */
  private initializeEventListener(): void {
    this.pointBeganEventListener = this.onPointerBegan.bind(this);
    this.pointMovedEventListener = this.onPointerMoved.bind(this);
    this.pointEndedEventListener = this.onPointerEnded.bind(this);
    this.pointCancelEventListener = this.onPointerCancel.bind(this);

    // 포인터 관련 콜백 함수를 등록합니다
    document.addEventListener('pointerdown', this.pointBeganEventListener, {
      passive: true
    });
    document.addEventListener('pointermove', this.pointMovedEventListener, {
      passive: true
    });
    document.addEventListener('pointerup', this.pointEndedEventListener, {
      passive: true
    });
    document.addEventListener('pointercancel', this.pointCancelEventListener, {
      passive: true
    });

    // 키보드 이벤트 추가
    this.keyDownEventListener = this.onKeyDown.bind(this);

    // 키보드 이벤트 등록
    document.addEventListener('keydown', this.keyDownEventListener, {
      passive: true
    });
  }

  /**
   * 입체파 초기화 SDK
   */
  private initializeCubism(): void {
    LAppPal.updateTime();

    // 입체파 설정
    this._cubismOption.logFunction = LAppPal.printMessage;
    this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
    CubismFramework.startUp(this._cubismOption);

    // 입체파 초기화
    CubismFramework.initialize();
  }

  /**
   * 캔버스를 생성하고 하위 방향을 초기화하십시오
   */
  private initializeSubdelegates(): void {
    const container = document.getElementById('live2d-container');

    if (!container) {
      console.error('live2d-container not found!');
      return;
    }

    this._canvases.prepareCapacity(LAppDefine.CanvasNum);
    this._subdelegates.prepareCapacity(LAppDefine.CanvasNum);

    for (let i = 0; i < LAppDefine.CanvasNum; i++) {
      // 1. 캔버스를 만들어서 container에 추가
      const canvas = document.createElement('canvas');
      this._canvases.pushBack(canvas);
      container.appendChild(canvas);

      // 2. subdelegate를 만들고 초기화
      const subdelegate = new LAppSubdelegate();
      subdelegate.initialize(this._canvases.at(i));
      this._subdelegates.pushBack(subdelegate);

      // 3. WebGL 컨텍스트 유실 여부 확인
      if (subdelegate.isContextLost()) {
        CubismLogError(
          `The context for Canvas at index ${i} was lost.`
        );
      }
    }
  }

  /**
   * 개인 생성자
   */
  private constructor() {
    this._cubismOption = new Option();
    this._subdelegates = new csmVector<LAppSubdelegate>();
    this._canvases = new csmVector<HTMLCanvasElement>();
  }

  private keyDownEventListener: (this: Document, ev: KeyboardEvent) => void;
  private onKeyDown(e: KeyboardEvent): void {
    // 추가
    if (e.key.toLowerCase() === 'd') {
      // 모든 뷰(캔버스)에 채팅 메시지를 표시합니다.
      for (
        let ite = this._subdelegates.begin();
        ite.notEqual(this._subdelegates.end());
        ite.preIncrement()
      ) {
        // 여기에 원하는 이름과 메시지를 넣으세요.
        ite.ptr().getView().showChatMessage('아냐', '동해물과 백두산이 마르고 닳도록 하느님이 보우하사 우리나라 만세');
      }
      return; // 다른 키 이벤트가 있다면 중복 실행 방지
    }
    // 추가
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onKeyDown(e.key);
    }
  }

  /**
   * 입체파 SDK 옵션
   */
  private _cubismOption: Option;

  /**
   * 작동 할 캔버스 요소
   */
  private _canvases: csmVector<HTMLCanvasElement>;

  /**
   * 세분화
   */
  private _subdelegates: csmVector<LAppSubdelegate>;

  /**
   * 등록 된 이벤트 리스너 기능 개체
   */
  private pointBeganEventListener: (this: Document, ev: PointerEvent) => void;

  /**
   * 등록 된 이벤트 리스너 기능 개체
   */
  private pointMovedEventListener: (this: Document, ev: PointerEvent) => void;

  /**
   * 등록 된 이벤트 리스너 기능 개체
   */
  private pointEndedEventListener: (this: Document, ev: PointerEvent) => void;

  /**
   * 등록 된 이벤트 리스너 기능 개체
   */
  private pointCancelEventListener: (this: Document, ev: PointerEvent) => void;

  private _webSocketManager: WebSocketManager | null = null;

  /**
   * 웹소켓 자동 초기화
   */
  private async initializeWebSocket(): Promise<void> {
    const WS_SERVER_URL = import.meta.env.VITE_WS_SERVER_URL;

    try {
      console.log('[App] WebSocket 연결 시작...');
      this._webSocketManager = new WebSocketManager(WS_SERVER_URL);
      await this._webSocketManager.initialize();
      console.log('[App] 실시간 음성 스트리밍 활성화됨');
    } catch (error) {
      console.error('[App] WebSocket 초기화 실패:', error);
      // 마이크 권한 거부 등의 에러 처리
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        alert('마이크 접근 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.');
      }
    }
  }
}
