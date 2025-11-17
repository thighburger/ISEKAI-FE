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

// [key: string]: string은 "어떤 문자열이든 키로 받을 수 있다"는 의미입니다.
type EmotionMap = { [key: string]: string };
type KeyMap = { [key: string]: string };
type VoiceMap = { [key: string]: string };

interface ModelConfig {
  displayName: string;
  emotionMap: EmotionMap; // EmotionMap 타입 적용
  keyMap: KeyMap;         // KeyMap 타입 적용
  voiceMap?: VoiceMap;   // voiceMap은 선택 사항
}

const modelConfigData: { [key: string]: ModelConfig } = {
  'ANIYA': {
    displayName: '아냐',
    emotionMap:{
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
    },
    keyMap: {
      '1': 'exp_01',
      '2': 'exp_02',
      '3': 'exp_03',
      '4': 'exp_04',
      '5': 'exp_05',
      '6': 'exp_06',
      '7': 'exp_07',
      '8': 'exp_08',
      '9': 'exp_09',
      '0': 'exp_10',
      't': 'exp_t',
      'u': 'exp_u',
      'w': 'exp_W',
      'y': 'exp_y',
      'c': 'exp_c'
    },
    voiceMap:{

    }
  },
  'HoshinoAi':{
    displayName: '호시노 아이',
    emotionMap:{
      // HoshinoAi/expressions/ 폴더의 파일들을 기반으로 합니다.
      // "ga.exp3.json" -> "ga"
      // "ku.exp3.json" -> "ku"
      // ...
      // 이 "친숙한 이름"(예: "놀람")은 원하시는 대로 수정하세요.
      "죽음": "ga.exp3",
      "웃음": "ku.exp3",
      "뾰로통": "sq.exp3",
      "메롱": "st.exp3",
      "음흉": "xinxin.exp3",
      "마이크": "zs1.exp3",
      "하트": "zs2.exp3"
    },
    keyMap:{
      // 위 emotionMap의 내부 이름("ga", "ku" 등)을 키보드에 매핑합니다.
      // 이 키('1', '2' 등)는 원하시는 키로 수정하세요.
      '1': 'ga.exp3',
      '2': 'ku.exp3',
      '3': 'sq.exp3',
      '4': 'st.exp3',
      '5': 'xinxin.exp3',
      '6': 'zs1.exp3',
      '7': 'zs2.exp3'
    },
    voiceMap:{
      // HoshinoAi 폴더에 음성 파일(.wav)이 없으므로 비워둡니다.
      // 만약 추가하신다면 'v': 'voices/my_voice.wav' 처럼 설정하세요.
    }
  }
}



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
  public startSubtitleWithEmotion(name: string, message: string, emotion: string): void {
    const model: LAppModel = this._models.at(0);
    if (!model) {
      return;
    }

    // 1. emotionMap에서 감정 키워드에 해당하는 표정 파일 이름을 찾습니다.
    const currentModelName = LAppDefine.ModelDir[this._sceneIndex];
    const config = modelConfigData[currentModelName];
    if (!config) return; // 설정이 없으면 종료

    const expressionName = config.emotionMap[emotion];
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

    // 3. View의 자막바에 이름과 메시지를 표시합니다.
    // (이름은 LAppDelegate에서 getCurrentModelDisplayName()을 호출하여 전달할 것이므로 수정 필요 없음)
    this._subdelegate.getView().showSubtitleMessage(name, message);
  }

  /**
   * 감정(표정) 변경 없이 자막만 표시합니다.
   * LAppDelegate에서 'd'키 테스트 등을 위해 호출합니다.
   * @param name - 표시할 캐릭터 이름
   * @param message - 표시할 메시지
   */
  public showSubtitleMessage(name: string, message: string): void {
    // 뷰를 가져와서 자막 표시를 위임합니다.
    this._subdelegate.getView().showSubtitleMessage(name, message);
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

    // 모델별로 .model3.json 파일 이름을 다르게 설정
    let modelJsonName: string;

    if (model === 'HoshinoAi') {
      // HoshinoAi 모델의 경우
      modelJsonName = 'Hoshino_Ai.model3.json';
    } else {
      // ANIYA 및 다른 모델의 경우
      modelJsonName = LAppDefine.ModelDir[index];
      modelJsonName += '.model3.json';
    }

    this.releaseAllModel();
    const instance = new LAppModel();
    instance.setSubdelegate(this._subdelegate);
    instance.loadAssets(modelPath, modelJsonName);
    this._models.pushBack(instance);

    // 1. 현재 모델의 표시 이름을 가져옵니다.
    const modelName = this.getCurrentModelDisplayName();
    // 2. 원하는 메시지를 만듭니다.
    const message = `안녕! 나는 ${modelName}야!`;
    // 3. 자막바를 즉시 갱신합니다.
    this.showSubtitleMessage(modelName, message);

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
   * 현재 로드된 모델의 표시 이름(displayName)을 반환합니다.
   */
  public getCurrentModelDisplayName(): string {
    const currentModelName = LAppDefine.ModelDir[this._sceneIndex];
    const config = modelConfigData[currentModelName]; // 파일 상단에 정의된 modelConfigData 참조
    return config ? config.displayName : 'Unknown'; // 설정이 있으면 이름 반환, 없으면 'Unknown'
  }

  /**
   * 키보드 입력 처리 (modelConfigData 사용)
   */
  public onKeyDown(key: string): void {
    const model: LAppModel = this._models.at(0);

    // 1. 현재 모델 설정 가져오기
    const currentModelName = LAppDefine.ModelDir[this._sceneIndex];
    const config = modelConfigData[currentModelName]; // 파일 상단에 정의된 modelConfigData 참조

    // 모델이나 설정이 없으면 아무것도 하지 않음
    if (!model || !config) return;

    const lowerKey = key.toLowerCase();

    // 2. 모델별 표정 처리 (keyMap)
    // config.keyMap에 현재 누른 키가 정의되어 있는지 확인
    if (config.keyMap[lowerKey]) {
      const expressionId = config.keyMap[lowerKey];
      model.setExpression(expressionId);
      LAppPal.printMessage(`[APP]Keyboard: Expression ${expressionId}`);
      return; // 표정을 실행했으므로 여기서 종료
    }

    // 3. 모델별 음성 처리 (voiceMap)
    // config.voiceMap이 존재하고, 현재 누른 키가 정의되어 있는지 확인
    if (config.voiceMap && config.voiceMap[lowerKey]) {
      const voicePath = config.voiceMap[lowerKey];
      model.startVoice(voicePath);
      LAppPal.printMessage(`[APP]Keyboard: Play Voice '${voicePath}'`);
      return; // 음성을 실행했으므로 여기서 종료
    }

    // 4. 모델 공통 키 처리 (모션, 모델 변경 등)
    switch (lowerKey) {
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

      default:
        // 기타 키는 무시
        break;
    }
  }
}
