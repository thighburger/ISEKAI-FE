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
    console.log('[LAppDelegate] Run loop started');
    loop();
  }

  /**
   * 풀어 주다.
   */
  private release(): void {
    this.releaseEventListener();
    this.releaseSubdelegates();

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
    if (this._isInitialized) return true;

    // 입체파 초기화 SDK
    this.initializeCubism();
    this.initializeEventListener(); // 이벤트 리스너 등록

    this._isInitialized = true;
    return true;
  }

  /**
   * Register a new view (canvas) to the delegate.
   * @param container The container element to append the canvas to.
   * @returns The index/ID of the registered view.
   */
  public registerView(container: HTMLElement): number {
    const index = this._subdelegates.getSize();

    // 1. 캔버스를 만들어서 container에 추가
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this._canvases.pushBack(canvas);
    container.appendChild(canvas);

    // 2. subdelegate를 만들고 초기화
    const subdelegate = new LAppSubdelegate();
    subdelegate.initialize(canvas);
    this._subdelegates.pushBack(subdelegate);

    // 3. WebGL 컨텍스트 유실 여부 확인
    if (subdelegate.isContextLost()) {
      CubismLogError(`The context for Canvas at index ${index} was lost.`);
    }

    return index;
  }

  /**
   * Remove a view by index.
   * Note: This simple implementation might have index shifting issues if not careful.
   * For now, we assume views are not frequently removed or we just release resources but keep the slot.
   * But proper way involves tracking IDs. Let's keep it simple for now: release the resources.
   */
  public removeView(index: number): void {
    if (index >= 0 && index < this._subdelegates.getSize()) {
      const subdelegate = this._subdelegates.at(index);
      const canvas = this._canvases.at(index);

      if (subdelegate) {
        subdelegate.release();
      }
      if (canvas && canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }

      // Removing from vector shifts indices, which breaks other view references if they rely on index.
      // Ideally, we should use a Map<ID, View> or handle nulls.
      // For this demo, let's just mark as released or handle vectors carefully.
      // Limitations: Vector doesn't support easy removal by index without shift.
      // We will leave it in vector but maybe clear it?
      // Re-implementing with proper ID management is out of scope for quick fix,
      // so we'll just accept that indices are unstable if removed,
      // BUT given React lifecycle, we usually mount/unmount.

      // WARNING: Current simple implementation does NOT remove from vector to preserve indices of others.
      // It just cleans up the DOM and WebGL.
    }
  }

  // Flag to check if global init is done
  private _isInitialized: boolean = false;
  /**
   * 감정 입력창의 이벤트를 설정합니다.
   */
  private initializeEmotionInput(): void {
    /*
    const inputElement = document.getElementById('emotion-input') as HTMLInputElement;

    if (inputElement) {
      inputElement.addEventListener('keydown', (e: KeyboardEvent) => {
        // Enter 키를 눌렀고, 입력값이 비어있지 않을 때
        if (e.key === 'Enter' && inputElement.value.trim() !== '') {
          const emotionKeyword = inputElement.value.trim();

          // Live2D 매니저를 가져옵니다.
          const live2DManager = this._subdelegates.at(0)?.getLive2DManager();
          if (live2DManager) {
            const modelName = live2DManager.getCurrentModelDisplayName();

            // live2D 매니저의 메서드를 호출하여 감정 표현과 채팅을 동시에 실행합니다.
            live2DManager.startSubtitleWithEmotion(
              modelName, // 이름
              `"${emotionKeyword}" 표정을 지었다!`, //표시할 메시지
              emotionKeyword // 사용자가 입력한 감정 키워드
            );
          }
          // 입력창을 비웁니다.
          inputElement.value = '';
        }
      });
    }
    */
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
  // Removed initializeSubdelegates as it is replaced by registerView

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
    // 2. 'd'가 아닌 다른 모든 키 (모델 관련)는 Manager로 전달합니다.
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

  public getLive2DManager(index: number = 0) {
    return this._subdelegates.at(index)?.getLive2DManager();
  }
  public getView(index: number = 0): any {
    return this._subdelegates.at(index)?.getView();
  }

  /**
   * 외부에서 립싱크 값을 설정합니다. (0.0 ~ 1.0)
   * React 등 외부 컴포넌트에서 오디오 볼륨을 분석하여 이 메서드를 호출합니다.
   */
  public setLipSyncValue(value: number, index: number = 0): void {
    const live2DManager = this.getLive2DManager(index);
    if (!live2DManager) return;

    const models = live2DManager._models;
    if (models.getSize() > 0) {
      const model = models.at(0);
      if (model) {
        model.setLipSyncValue(value);
      }
    }
  }
}
