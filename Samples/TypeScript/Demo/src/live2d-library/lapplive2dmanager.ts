/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { ACubismMotion } from '@framework/motion/acubismmotion';
import { csmVector } from '@framework/type/csmvector';
import { Live2DCubismFramework } from '@framework/live2dcubismframework';
import CubismFramework = Live2DCubismFramework.CubismFramework;

import * as LAppDefine from './lappdefine';
import { LAppModel } from './lappmodel';
import { LAppPal } from './lapppal';
import { LAppSubdelegate } from './lappsubdelegate';

import { ModelLayout } from './lappmodel';

export interface MotionMapItem {
  group: string;
  index: number;
  priority?: number;
}

export interface Live2DModelConfig {
  emotionMap?: { [key: string]: string };
  keyMap?: { [key: string]: string };
  voiceMap?: { [key: string]: string };
  motionMap?: { [key: string]: MotionMapItem };  // 모션 매핑
  layout?: ModelLayout;
}

// ... existing code ...

/**
 * 샘플 애플리케이션에서 CubismModel을 관리하는 클래스
 * 모델을 생성 및 폐기하고, 탭 이벤트를 처리하며, 모델을 스위치하십시오.
 */
export class LAppLive2DManager {
  // ▼▼▼ 이 메서드를 클래스 내부에 추가합니다 ▼▼▼
  /**
   * 지정된 감정(표정)으로 모델의 표정을 변경합니다.
   * AI 연동을 위한 핵심 기능입니다.
   * @param emotion - emotionMap에 정의된 감정 키워드 (예: "슬픔")
   */
  /**
   * 감정에 따라 표정이나 모션을 적용합니다.
   * @param emotion 감정 키워드 (예: "happy", "sad", "neutral", "embarrassed")
   */
  public applyEmotion(emotion: string): void {
      const model: LAppModel = this._models.at(0);
      if (!model) return;

      // 1. 기존 강제 파라미터 초기화 (새 감정 적용 전 상태 리셋)
      model.clearParameterOverrides();

      console.log(`[Manager] applyEmotion: ${emotion}`);

      switch (emotion) {
          case 'neutral':
          case '슬픔':
              console.log("슬픔");
              this.setParameterValue("ParamEyeLOpen", 0.4); // 눈 작게
              this.setParameterValue("ParamEyeROpen", 0.4);
              this.setParameterValue("MouthFrownLeft", 1); // 입모양 삐짐
              this.setParameterValue("MouthFrownRight", 1); // 입모양 삐짐
              this.setParameterValue("MouthShrugLower", 1.0); 
              this.setParameterValue("MouthCheekPuff", 0.5); 
              this.setParameterValue("ParamAngleY",-15);
              this.setParameterValue("ParamBrowLAngle",-30); 
              this.setParameterValue("ParamBrowRAngle",-30); 
              this.setParameterValue("ParamBrowLY",-1);
              this.setParameterValue("ParamBrowRY",-1); 
              break;
          case '부끄러움':
              this.setParameterValue("ParamAngleX", -20); 
              this.setParameterValue("ParamAngleY", -30);
              this.setParameterValue("ParamEyeBallY", 1);
              this.setParameterValue("ParamBrowLForm", -1);
              this.setParameterValue("ParamBrowRForm", -1);
              this.setParameterValue("ParamBodyAngleX", 30);
              this.setParameterValue("ParamBodyAngleZ", -15);
              this.setParameterValue("Param16", 30);
              this.setParameterValue("Param32", -30);

               
              break;
          case '행복':
              this.setParameterValue("ParamEyeLOpen", 1.0); // 눈 크게
              this.setParameterValue("ParamEyeROpen", 1.0);
              this.setParameterValue("MouthSmileLeft", 1); // 입 웃음
              this.setParameterValue("MouthSmileRight", 1); // 입 웃음
              this.setParameterValue("ParamEyeLSmile", 1); // 눈 웃음
              this.setParameterValue("ParamEyeRSmile", 1); // 눈 웃음
              break;

          case '중립':
              break;    

          case '화남':
              this.setParameterValue("ParamEyeLOpen", 1.0); // 눈 크게
              this.setParameterValue("ParamEyeROpen", 1.0);
              this.setParameterValue("ParamBrowLAngle", 1);
              this.setParameterValue("ParamBrowRAngle", 1);
              this.setParameterValue("Param40",1);
              this.setParameterValue("Param43",1);
              this.setParameterValue("ParamBrowLAngle",30); 
              this.setParameterValue("ParamBrowRAngle",30); 
              this.setParameterValue("ParamBrowLY",-1);
              this.setParameterValue("ParamBrowRY",-1);
              this.setParameterValue("MouthShrugUpper",1);
              break;

          case '놀람':
              this.setParameterValue("ParamEyeLOpen", 1.0); // 눈 크게
              this.setParameterValue("ParamEyeROpen", 1.0);
              this.setParameterValue("ParamMouthForm", -0.5); 
              this.setParameterValue("ParamBrowLForm",1);
              this.setParameterValue("ParamBrowRForm",1);
              this.setParameterValue("ParamJawOpen",1);
              this.setParameterValue("ParamMouthPucker",1);
              break;

          case '경멸':
              this.setParameterValue("ParamAngleY", 20); 
              this.setParameterValue("ParamAngleZ", -30);
              this.setParameterValue("EyeR_Squint", 1); 
              this.setParameterValue("EyeL_Squint",1);
              this.setParameterValue("MouthShrugUpper",1);
              this.setParameterValue("ParamBrowLY",-1);
              this.setParameterValue("ParamBrowRY",-1);
              this.setParameterValue("ParamEyeLSmile",0.5); 
              this.setParameterValue("ParamEyeRSmile",0.5); 
              this.setParameterValue("ParamBrowLAngle",-1); 
              this.setParameterValue("ParamBrowRAngle",-1); 
              this.setParameterValue("ParamBrowLForm",1); 
              this.setParameterValue("ParamBrowRForm",-0.5); 
              this.setParameterValue("ParamEyeLOpen",0.75); 
              this.setParameterValue("ParamEyeROpen",0.6); 
              this.setParameterValue("ParamEyeBallY",-1); 
              break;
          

          default:
              //매칭되는 로직이 없으면 무표정
              break;
      }
  }

  public startMotionWithEmotion(emotion: string): void {
    const model: LAppModel = this._models.at(0);
    if (!model) {
      return;
    }

    if (!this._modelConfig) {
      LAppPal.printMessage(`[APP] No model config set. Cannot map emotion: "${emotion}"`);
      return;
    }

    // 1. emotionMap에서 감정 키워드에 해당하는 표정 파일 이름을 찾습니다.
    const expressionName = this._modelConfig.emotionMap[emotion];

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
  }

  /**
   * 지정된 파라미터 ID의 값을 설정합니다. (lerp로 부드럽게 전환)
   * @param paramId 파라미터 ID 문자열 (예: "ParamAngleX")
   * @param value 설정할 값
   * @param weight 가중치 (기본값 1.0) - 현재 구현에서는 무시됨
   */
  public setParameterValue(paramId: string, value: number, weight: number = 1.0): void {
    const model: LAppModel = this._models.at(0);
    if (!model) {
      return;
    }

    // lerp 시스템으로 부드럽게 전환 (즉시 적용 제거)
    model.setParameterOverride(paramId, value);
  }

  /**
   * 매핑된 이름으로 모션 재생 (config.json의 motionMap 사용)
   * @param motionName 모션 이름 (예: "인사", "끄덕임")
   * @returns 재생 성공 여부
   */
  public playMappedMotion(motionName: string): boolean {
    if (!this._modelConfig?.motionMap) {
      console.warn('[Manager] No motionMap in config');
      return false;
    }
    
    const motionInfo = this._modelConfig.motionMap[motionName];
    if (!motionInfo) {
      console.warn(`[Manager] Unknown motion name: ${motionName}`);
      return false;
    }
    
    this.startMotion(motionInfo.group, motionInfo.index, motionInfo.priority ?? 2);
    return true;
  }

  /**
   * 모션 재생
   * @param group 모션 그룹 이름 (예: "Idle", "TapBody")
   * @param index 모션 인덱스 (해당 그룹 내 몇 번째 모션)
   * @param priority 우선순위 (1: 낮음, 2: 보통, 3: 높음)
   */
  public startMotion(group: string, index: number = 0, priority: number = 2): void {
    const model: LAppModel = this._models.at(0);
    if (!model) {
      console.warn('[Manager] No model loaded');
      return;
    }
    
    console.log(`[Manager] startMotion: group=${group}, index=${index}, priority=${priority}`);
    model.startMotion(group, index, priority);
  }

  /**
   * Set external model configuration
   */
  public setModelConfig(config: Live2DModelConfig): void {
    this._modelConfig = config;
  }

  /**
   * 립싱크 값 설정
   */
  public setLipSyncValue(value: number): void {
    const model: LAppModel = this._models.at(0);
    if (model) {
      model.setLipSyncValue(value);
    }
  }

  private _modelConfig: Live2DModelConfig | null = null;

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
      LAppPal.printMessage(`[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`);
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

    if (!model) return;

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

    // 레이아웃 설정 적용
    if (this._modelConfig && this._modelConfig.layout) {
      instance.setLayoutConfig(this._modelConfig.layout);
    }

    instance.loadAssets(modelPath, modelJsonName);
    this._models.pushBack(instance);

    // 1. 현재 모델의 표시 이름을 가져옵니다.
    // const modelName = this.getCurrentModelDisplayName();
    // 2. 원하는 메시지를 만듭니다.
    // const message = `안녕! 나는 ${modelName}야!`;
    // 3. 자막바를 즉시 갱신합니다.
    // this.showSubtitleMessage(modelName, message); // 자막 제거됨
  }

  /**
   * Load specific model by path
   */
  public loadModel(modelPath: string, modelJsonName: string): void {
    this.releaseAllModel();
    const instance = new LAppModel();
    instance.setSubdelegate(this._subdelegate);

    // 레이아웃 설정 적용
    if (this._modelConfig && this._modelConfig.layout) {
      instance.setLayoutConfig(this._modelConfig.layout);
    }

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
   * Load a model from in-memory resources.
   * @param resources Map of file paths to ArrayBuffers
   * @param modelPath relative path to model directory (e.g. "Char/")
   * @param modelJsonName Name of the model3.json file (e.g. "model.model3.json")
   */
  public loadModelFromResources(
    resources: Map<string, ArrayBuffer>,
    modelPath: string,
    modelJsonName: string
  ): void {
    this.releaseAllModel();
    const instance = new LAppModel();
    instance.setSubdelegate(this._subdelegate);

    // 레이아웃 설정 적용
    if (this._modelConfig && this._modelConfig.layout) {
      instance.setLayoutConfig(this._modelConfig.layout);
    }

    // Inject resources
    instance.preLoadResources(resources);

    // Load assets.
    instance.loadAssets(modelPath, modelJsonName);

    this._models.pushBack(instance);
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
    // this.changeScene(this._sceneIndex); // Remove default local model loading
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
   * 키보드 입력 처리 (modelConfig 사용)
   */
  public onKeyDown(key: string): void {
    const model: LAppModel = this._models.at(0);

    // 1. 현재 모델 설정 가져오기
    // 모델이나 설정이 없으면 아무것도 하지 않음
    if (!model || !this._modelConfig) return;

    const lowerKey = key.toLowerCase();

    // 2. 모델별 표정 처리 (keyMap)
    // config.keyMap에 현재 누른 키가 정의되어 있는지 확인
    // Note: Live2DModelConfig definition needs optional keyMap for this to work implicitly,
    // or we assume it's part of the config. Let's start with just generic handling or skip if not in interface.
    // The previous interface had keyMap. We should add it to Live2DModelConfig if we want to keep this feature.

    // For now, let's assume basic emotion mapping from digits 1-9 if they exist in emotionMap values?
    // Or better, let's rely on the config interface having keyMap if we add it.
    // But to match the plan, let's just minimalize it or comment it out if not critical,
    // OR expand Live2DModelConfig interface to include keyMap.

    // Let's assume we want to keep the feature.
  }
}
