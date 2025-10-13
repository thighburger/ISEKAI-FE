/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { ACubismMotion } from '@framework/motion/acubismmotion';
import { csmVector } from '@framework/type/csmvector';

import * as LAppDefine from './lappdefine';
import { LAppModel } from './lappmodel';
import { LAppPal } from './lapppal';
import { LAppSubdelegate } from './lappsubdelegate';

/**
 * 챗봇 감정 키워드와 Live2D 표정(Expression) 이름을 연결하는 맵 객체입니다.
 * 여기에 정의된 키워드(예: "행복")를 챗봇이 보내주면,
 * 해당하는 값(예: 'exp_06')의 표정이 모델에 적용됩니다.
 */
const emotionMap: { [key: string]: string } = {
  // --- 긍정적인 감정 ---
  "두근두근": "exp_06",     // starry_eyes: 반짝이는 별눈, 가장 강한 긍정 표현
  "씨익": "exp_y",      // grin: 이를 드러내고 활짝 웃는 표정
  "음흉": "exp_04",     // heh_face: '흥'하는 듯한 만족스러운 표정

  // --- 부정적인 감정 ---
  "슬픔": "exp_02",     // crying: 눈물이 그렁그렁한 표정
  "오열": "exp_W",      // wailing: 펑펑 우는 표정
  "분노": "exp_07",     // angry: 화가 난 표정
  "어이없음": "exp_08",  // speechless: 황당하거나 어이없을 때의 표정

  // --- 중립적인 감정 ---
  "놀람": "exp_03",     // shocked: 깜짝 놀란 표정
  "경악": "exp_09",     // startled: 더 크게 놀라거나 경악하는 표정
  "의문": "exp_05",     // question: 물음표가 뜨는 듯한 궁금한 표정
  "기본": "exp_c",      // neutral: 평상시의 기본 표정

  // --- 기타 행동 또는 상태 ---
  "땅콩모드": "exp_t",   // peanut_mode: 땅콩을 먹는 특별 모션
  "동공축소": "exp_u",   // small_pupils: 동공이 작아지는 표정
  "손동작": "exp_01",    // hand_gesture: 손 제스처
  "옷자랑": "exp_10",    // show_clothes: 다른 옷을 보여주는 상태
};


/**
 * 샘플 애플리케이션에서 CubismModel을 관리하는 클래스
 * 모델을 생성 및 폐기하고, 탭 이벤트를 처리하며, 모델을 스위치하십시오.
 */
export class LAppLive2DManager {
  // ▼▼▼ 이 메서드를 클래스 내부에 추가합니다 ▼▼▼
  /**
   * 지정된 감정(표정)으로 채팅 메시지를 시작합니다.
   * AI 연동을 위한 핵심 기능입니다.
   * @param name - 표시할 캐릭터 이름
   * @param message - 표시할 메시지
   * @param emotion - emotionMap에 정의된 감정 키워드 (예: "슬픔")
   */
  public startChatWithEmotion(name: string, message: string, emotion: string): void {
    const model: LAppModel = this._models.at(0);
    if (!model) {
      return;
    }

    // 1. emotionMap에서 감정 키워드에 해당하는 표정 파일 이름을 찾습니다.
    const expressionName = emotionMap[emotion];

    // 2. 해당하는 표정이 있으면 모델에 적용하고, 없으면 랜덤 표정을 짓습니다.
    if (expressionName) {
      model.setExpression(expressionName);
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(`[APP] Emotion: "${emotion}" -> Expression: "${expressionName}"`);
      }
    } else {
      model.setRandomExpression(); // 맵에 없는 키워드면 랜덤 표정
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(`[APP] Emotion: "${emotion}" not found. Setting random expression.`);
      }
    }

    // 3. View의 채팅바에 이름과 메시지를 표시합니다.
    this._subdelegate.getView().showChatMessage(name, message);
  }
  /**
   * 현재 장면에서 보관 된 모든 모델을 무료로 제공합니다
   */
  private releaseAllModel(): void {
    this._models.clear();
  }

  /**
   * 화면을 드래그 할 때 동작
   *
   * @param x x 화면의 좌표
   * @param y 화면 Y 좌표
   */
  public onDrag(x: number, y: number): void {
    const model: LAppModel = this._models.at(0);
    if (model) {
      model.setDragging(x, y);
    }
  }

  /**
   * 화면을 누를 때해야 할 일
   *
   * @param x x 화면의 좌표
   * @param y 화면 Y 좌표
   */
  public onTap(x: number, y: number): void {
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(
        `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`
      );
    }

    const model: LAppModel = this._models.at(0);

    if (model.hitTest(LAppDefine.HitAreaNameHead, x, y)) {
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(`[APP]hit area: [${LAppDefine.HitAreaNameHead}]`);
      }
      model.setRandomExpression();
    } else if (model.hitTest(LAppDefine.HitAreaNameBody, x, y)) {
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(`[APP]hit area: [${LAppDefine.HitAreaNameBody}]`);
      }
      model.startRandomMotion(
        LAppDefine.MotionGroupTapBody,
        LAppDefine.PriorityNormal,
        this.finishedMotion,
        this.beganMotion
      );
    }
  }

  /**
   * 화면을 업데이트 할 때해야 할 일
   * 모델 업데이트 및 도면 프로세스를 수행합니다
   */
  public onUpdate(): void {
    const { width, height } = this._subdelegate.getCanvas();

    const projection: CubismMatrix44 = new CubismMatrix44();
    const model: LAppModel = this._models.at(0);

    if (model.getModel()) {
      if (model.getModel().getCanvasWidth() > 1.0 && width < height) {
        // 수직 창에 긴 수평 모델을 표시 할 때 모델의 너비 크기에 따라 스케일을 계산합니다.
        model.getModelMatrix().setWidth(2.0);
        projection.scale(1.0, width / height);
      } else {
        projection.scale(height / width, 1.0);
      }

      // 필요한 경우 여기에 곱하십시오
      if (this._viewMatrix != null) {
        projection.multiplyByMatrix(this._viewMatrix);
      }
    }

    model.update();
    model.draw(projection); // 参照渡しなのでprojectionは変質する。
  }

  /**
   *다음 장면으로 교체하십시오
   * 샘플 응용 프로그램이 모델 세트를 전환합니다.
   */
  public nextScene(): void {
    const no: number = (this._sceneIndex + 1) % LAppDefine.ModelDirSize;
    this.changeScene(no);
  }

  /**
   * 전환 장면
   * 샘플 응용 프로그램이 모델 세트를 전환합니다.
   * @param 색인
   */
  private changeScene(index: number): void {
    this._sceneIndex = index;

    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(`[APP]model index: ${this._sceneIndex}`);
    }

    // modelDir []에서 보유한 디렉토리 이름에서
    // model3.json의 경로를 결정합니다.
    // 디렉토리 이름이 model3.json의 이름과 일치하는지 확인하십시오.
    const model: string = LAppDefine.ModelDir[index];
    const modelPath: string = LAppDefine.ResourcesPath + model + '/';
    let modelJsonName: string = LAppDefine.ModelDir[index];
    modelJsonName += '.model3.json';

    this.releaseAllModel();
    const instance = new LAppModel();
    instance.setSubdelegate(this._subdelegate);
    instance.loadAssets(modelPath, modelJsonName);
    this._models.pushBack(instance);
  }

  public setViewMatrix(m: CubismMatrix44) {
    for (let i = 0; i < 16; i++) {
      this._viewMatrix.getArray()[i] = m.getArray()[i];
    }
  }

  /**
   * 모델 추가
   */
  public addModel(sceneIndex: number = 0): void {
    this._sceneIndex = sceneIndex;
    this.changeScene(this._sceneIndex);
  }

  /**
   * 생성자
   */
  public constructor() {
    this._subdelegate = null;
    this._viewMatrix = new CubismMatrix44();
    this._models = new csmVector<LAppModel>();
    this._sceneIndex = 0;
  }

  /**
   * 풀어 주다.
   */
  public release(): void {}

  /**
   * 초기화.
   * @param subdelegate
   */
  public initialize(subdelegate: LAppSubdelegate): void {
    this._subdelegate = subdelegate;
    this.changeScene(this._sceneIndex);
  }

  /**
   * 당신이 속한 세분화
   */
  private _subdelegate: LAppSubdelegate;

  _viewMatrix: CubismMatrix44; // モデル描画に用いるview行列
  _models: csmVector<LAppModel>; // モデルインスタンスのコンテナ
  private _sceneIndex: number; // 表示するシーンのインデックス値

  // 모션 재생을 시작하려면 콜백 함수
  beganMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage('Motion Began:');
    console.log(self);
  };
  // 동작 재생 종료를위한 콜백 함수
  finishedMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage('Motion Finished:');
    console.log(self);
  };

  /**
   * 키보드 입력 처리
   */
// 수정중
  public onKeyDown(key: string): void {
    const model: LAppModel = this._models.at(0);

    if (!model) return;

    switch (key.toLowerCase()) {
      // '1' 키로 '0.exp3.json' 파일의 표정을 재생하려면
      case '1':
        model.setExpression('exp_01'); // "Name"인 "exp_01"을 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_01');
        break;
      // '2' 키로 '1.exp3.json' 파일의 표정을 재생하려면
      case '2':
        model.setExpression('exp_02'); // "Name"인 "exp_02"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_02');
        break;
      // '3' 키로 '3.exp3.json' 파일의 표정을 재생하려면
      case '3':
        model.setExpression('exp_03'); // "Name"인 "exp_03"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_03');
        break;
      // '4' 키로 '4.exp3.json' 파일의 표정을 재생하려면
      case '4':
        model.setExpression('exp_04'); // "Name"인 "exp_04"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_04');
        break;
      // '5' 키로 '5.exp3.json' 파일의 표정을 재생하려면
      case '5':
        model.setExpression('exp_05'); // "Name"인 "exp_05"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_05');
        break;
      case '6':
        model.setExpression('exp_06'); // "Name"인 "exp_06"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_06');
        break;
      case '7':
        model.setExpression('exp_07'); // "Name"인 "exp_07"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_07');
        break;
      case '8':
        model.setExpression('exp_08'); // "Name"인 "exp_08"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_08');
        break;
      case '9':
        model.setExpression('exp_09'); // "Name"인 "exp_09"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_09');
        break;
      case '0':
        model.setExpression('exp_10'); // "Name"인 "exp_10"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_10');
        break;
      // 't' 키로 't.exp3.json' 파일의 표정을 재생하려면
      case 't':
        model.setExpression('exp_t'); // "Name"인 "exp_t"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_t');
        break;
      case 'u':
        model.setExpression('exp_u'); // "Name"인 "exp_u"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_u');
        break;
      case 'w':
        model.setExpression('exp_W'); // "Name"인 "exp_W"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_w');
        break;
      case 'y':
        model.setExpression('exp_y'); // "Name"인 "exp_y"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_y');
        break;
      case 'c':
        model.setExpression('exp_c'); // "Name"인 "exp_c"를 사용
        LAppPal.printMessage('[APP]Keyboard: Expression exp_c');
        break;


// 수정중   
      case 'm':
        // M키: 랜덤 바디 모션
        model.startRandomMotion(
          LAppDefine.MotionGroupTapBody,
          LAppDefine.PriorityNormal,
          this.finishedMotion,
          this.beganMotion
        );
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage('[APP]Keyboard: Random Motion');
        }
        break;

      case 'i':
        // I키: 아이들 모션
        model.startRandomMotion(
          LAppDefine.MotionGroupIdle,
          LAppDefine.PriorityNormal,
          this.finishedMotion,
          this.beganMotion
        );
        if (LAppDefine.DebugLogEnable) {
          LAppPal.printMessage('[APP]Keyboard: Idle Motion');
        }
        break;

      case 'n':
        // N키: 다음 모델
        this.nextScene();
        break;

      case 'v':
      // V키: 보컬 오디오 재생 + 립싱크
      model.startVoice('voices/vocals.wav');
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage('[APP]Keyboard: Play Voice with Lip Sync');
      }
      break;

      default:
        // 기타 키는 무시
        break;
    }
  }
}
