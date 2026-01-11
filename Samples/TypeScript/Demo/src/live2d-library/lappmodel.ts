/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

import { CubismDefaultParameterId } from '@framework/cubismdefaultparameterid';
import { CubismModelSettingJson } from '@framework/cubismmodelsettingjson';
import { BreathParameterData, CubismBreath } from '@framework/effect/cubismbreath';
import { CubismEyeBlink } from '@framework/effect/cubismeyeblink';
import { ICubismModelSetting } from '@framework/icubismmodelsetting';
import { CubismIdHandle } from '@framework/id/cubismid';
import { CubismFramework } from '@framework/live2dcubismframework';
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismUserModel } from '@framework/model/cubismusermodel';
import {
  ACubismMotion,
  BeganMotionCallback,
  FinishedMotionCallback
} from '@framework/motion/acubismmotion';
import { CubismMotion } from '@framework/motion/cubismmotion';
import {
  CubismMotionQueueEntryHandle,
  InvalidMotionQueueEntryHandleValue
} from '@framework/motion/cubismmotionqueuemanager';
import { csmMap } from '@framework/type/csmmap';
import { csmRect } from '@framework/type/csmrectf';
import { csmString } from '@framework/type/csmstring';
import { csmVector } from '@framework/type/csmvector';
import { CSM_ASSERT, CubismLogError, CubismLogInfo } from '@framework/utils/cubismdebug';

import * as LAppDefine from './lappdefine';
import { LAppPal } from './lapppal';
import { TextureInfo } from './lapptexturemanager';
import { LAppWavFileHandler } from './lappwavfilehandler';
import { CubismMoc } from '@framework/model/cubismmoc';
import { LAppDelegate } from './lappdelegate';
import { LAppSubdelegate } from './lappsubdelegate';

export interface ModelLayout {
  scaleX?: number;
  scaleY?: number;
  x?: number;
  y?: number;
}

enum LoadStep {
  LoadAssets,
  LoadModel,
  WaitLoadModel,
  LoadExpression,
  WaitLoadExpression,
  LoadPhysics,
  WaitLoadPhysics,
  LoadPose,
  WaitLoadPose,
  SetupEyeBlink,
  SetupBreath,
  LoadUserData,
  WaitLoadUserData,
  SetupEyeBlinkIds,
  SetupLipSyncIds,
  SetupLayout,
  LoadMotion,
  WaitLoadMotion,
  CompleteInitialize,
  CompleteSetupModel,
  LoadTexture,
  WaitLoadTexture,
  CompleteSetup
}

// 헬퍼 함수: 경로에서 파일명(혹은 상대 경로)만 추출하거나, _modelHomeDir를 제거하는 로직이 필요할 수 있음.
// 여기서는 간단히 getFile 내부에서 처리.


/**
 * 사용자가 실제로 사용할 모델의 구현 클래스
 * 모델 생성, 기능 구성 요소 생성, 업데이트 처리 및 렌더링을 요구합니다.
 */
export class LAppModel extends CubismUserModel {
  /**
   * 레이아웃 설정 (스케일, 위치 등)
   */
  private _layoutConfig: ModelLayout | null = null;

  public setLayoutConfig(config: ModelLayout): void {
      this._layoutConfig = config;
  }

  /**
   * Model3.json이있는 디렉토리 및 파일 경로에서 모델을 생성합니다.
   * @param dir
   * @param filename
   */
  public loadAssets(dir: string, fileName: string): void {
    this._modelHomeDir = dir;

    this.getFile(fileName)
      .then(arrayBuffer => {
        const setting: ICubismModelSetting = new CubismModelSettingJson(
          arrayBuffer,
          arrayBuffer.byteLength
        );

        // 상태를 업데이트합니다
        this._state = LoadStep.LoadModel;

        // 결과 저장
         this.setupModel(setting);
      })
      .catch(error => {
        CubismLogError(`Failed to load header file ${fileName}`);
      });
  }

  /**
   * Zip 파일 등에서 메모리로 로드된 리소스를 설정합니다.
   * @param resources 파일 경로(상대 경로)를 키로 하고 ArrayBuffer를 값으로 갖는 맵
   */
  public preLoadResources(resources: Map<string, ArrayBuffer>): void {
      this._resources = resources;
  }

  /**
   * 파일 로드 헬퍼 (네트워크 또는 메모리)
   */
  private getFile(fileName: string): Promise<ArrayBuffer> {
      // 1. 메모리 리소스가 있으면 우선 검색
      if (this._resources) {
          // _modelHomeDir와 fileName을 결합하여 맵 키로 사용
          let targetPath = fileName;
          if (this._modelHomeDir && !fileName.startsWith(this._modelHomeDir)) {
              targetPath = this._modelHomeDir + fileName;
          }
          
          if (this._resources.has(targetPath)) {
              return Promise.resolve(this._resources.get(targetPath)!);
          }
          
          // 혹시 fileName 그대로 있을 수도 있으니 확인 (루트 경로 등)
          if (this._resources.has(fileName)) {
               return Promise.resolve(this._resources.get(fileName)!);
          }

           console.warn(`[LAppModel] Resource not found in memory map: ${targetPath} or ${fileName}`);
      }


      // 2. 네트워크 페치
      return fetch(`${this._modelHomeDir}${fileName}`).then(response => {
          if (!response.ok) {
              throw new Error(`Network response was not ok: ${response.status}`);
          }
          return response.arrayBuffer();
      });
  }

  /**
   * model3.json에서 모델을 생성합니다.
   * Model3.json의 설명에 따라 모델, 모션, 물리 및 기타 구성 요소를 생성합니다.
   *
   * @Param 설정 ICubismModelSetting 인스턴스
   */
  private setupModel(setting: ICubismModelSetting): void {
    this._updating = true;
    this._initialized = false;

    this._modelSetting = setting;

    // CubismModel
    if (this._modelSetting.getModelFileName() != '') {
      const modelFileName = this._modelSetting.getModelFileName();

      this.getFile(modelFileName)
        .then(arrayBuffer => {
          this.loadModel(arrayBuffer, this._mocConsistency);
          this._state = LoadStep.LoadExpression;

          // 콜백
          loadCubismExpression();
        })
        .catch(err => {
            CubismLogError(`Failed to load file ${modelFileName}`);
        });

      this._state = LoadStep.WaitLoadModel;
    } else {
      LAppPal.printMessage('Model data does not exist.');
    }

    // 표현
    const loadCubismExpression = (): void => {
      if (this._modelSetting.getExpressionCount() > 0) {
        const count: number = this._modelSetting.getExpressionCount();

        for (let i = 0; i < count; i++) {
          const expressionName = this._modelSetting.getExpressionName(i);
          const expressionFileName = this._modelSetting.getExpressionFileName(i);

          this.getFile(expressionFileName)
            .then(arrayBuffer => {
              const motion: ACubismMotion = this.loadExpression(
                arrayBuffer,
                arrayBuffer.byteLength,
                expressionName
              );

              if (this._expressions.getValue(expressionName) != null) {
                ACubismMotion.delete(this._expressions.getValue(expressionName));
                this._expressions.setValue(expressionName, null);
              }

              this._expressions.setValue(expressionName, motion);

              this._expressionCount++;

              if (this._expressionCount >= count) {
                this._state = LoadStep.LoadPhysics;

                // 콜백
                loadCubismPhysics();
              }
            })
            .catch(() => {
                 CubismLogError(`Failed to load file ${expressionFileName}`);
                 // Skip or handle error
                 // In previous code it silently failed or returned empty buffer.
                 // For now, let's just proceed or stuck?
                 // Original logic returned empty buffer on 404.
            });
        }
        this._state = LoadStep.WaitLoadExpression;
      } else {
        this._state = LoadStep.LoadPhysics;

        // 콜백
        loadCubismPhysics();
      }
    };

    // 물리학
    const loadCubismPhysics = (): void => {
      if (this._modelSetting.getPhysicsFileName() != '') {
        const physicsFileName = this._modelSetting.getPhysicsFileName();

        this.getFile(physicsFileName)
          .then(arrayBuffer => {
            this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);

            this._state = LoadStep.LoadPose;

            // 콜백
            loadCubismPose();
          })
          .catch(() => {
              CubismLogError(`Failed to load file ${physicsFileName}`);
          });
        this._state = LoadStep.WaitLoadPhysics;
      } else {
        this._state = LoadStep.LoadPose;

        // 콜백
        loadCubismPose();
      }
    };

    // 포즈
    const loadCubismPose = (): void => {
      if (this._modelSetting.getPoseFileName() != '') {
        const poseFileName = this._modelSetting.getPoseFileName();

        this.getFile(poseFileName)
          .then(arrayBuffer => {
            this.loadPose(arrayBuffer, arrayBuffer.byteLength);

            this._state = LoadStep.SetupEyeBlink;

            // 콜백
            setupEyeBlink();
          })
          .catch(() => {
              CubismLogError(`Failed to load file ${poseFileName}`);
          });
        this._state = LoadStep.WaitLoadPose;
      } else {
        this._state = LoadStep.SetupEyeBlink;

        // 콜백
        setupEyeBlink();
      }
    };

    // EyeBlink
    const setupEyeBlink = (): void => {
      if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
        this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
        this._state = LoadStep.SetupBreath;
      }

      // 콜백
      setupBreath();
    };

    // 호흡
    const setupBreath = (): void => {
      this._breath = CubismBreath.create();

      const breathParameters: csmVector<BreathParameterData> = new csmVector();
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5)
      );
      breathParameters.pushBack(
        new BreathParameterData(
          CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath),
          0.5,
          0.5,
          3.2345,
          1
        )
      );

      this._breath.setParameters(breathParameters);
      this._state = LoadStep.LoadUserData;

      // 콜백
      loadUserData();
    };

    // userData
    const loadUserData = (): void => {
      if (this._modelSetting.getUserDataFile() != '') {
        const userDataFile = this._modelSetting.getUserDataFile();

        this.getFile(userDataFile)
          .then(arrayBuffer => {
            this.loadUserData(arrayBuffer, arrayBuffer.byteLength);

            this._state = LoadStep.SetupEyeBlinkIds;

            // 콜백
            setupEyeBlinkIds();
          })
          .catch(() => {
               CubismLogError(`Failed to load file ${userDataFile}`);
          });

        this._state = LoadStep.WaitLoadUserData;
      } else {
        this._state = LoadStep.SetupEyeBlinkIds;

        // 콜백
        setupEyeBlinkIds();
      }
    };

    // EyeBlinkids
    const setupEyeBlinkIds = (): void => {
      const eyeBlinkIdCount: number = this._modelSetting.getEyeBlinkParameterCount();

      for (let i = 0; i < eyeBlinkIdCount; ++i) {
        this._eyeBlinkIds.pushBack(this._modelSetting.getEyeBlinkParameterId(i));
      }

      this._state = LoadStep.SetupLipSyncIds;

      // 콜백
      setupLipSyncIds();
    };

    // LipSyncids
    const setupLipSyncIds = (): void => {
      const lipSyncIdCount = this._modelSetting.getLipSyncParameterCount();

      for (let i = 0; i < lipSyncIdCount; ++i) {
        this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i));
      }
      this._state = LoadStep.SetupLayout;

      // 콜백
      setupLayout();
    };

    // 레이아웃
    const setupLayout = (): void => {
      const layout: csmMap<string, number> = new csmMap<string, number>();

      if (this._modelSetting == null || this._modelMatrix == null) {
        CubismLogError('Failed to setupLayout().');
        return;
      }

      this._modelSetting.getLayoutMap(layout);
      this._modelMatrix.setupFromLayout(layout);
      this._modelSetting.getLayoutMap(layout);
      this._modelMatrix.setupFromLayout(layout);

      // 외부에서 주입된 레이아웃 설정 적용
      if (this._layoutConfig) {
        if (this._layoutConfig.scaleX !== undefined && this._layoutConfig.scaleY !== undefined) {
             this._modelMatrix.scale(this._layoutConfig.scaleX, this._layoutConfig.scaleY);
        }
        if (this._layoutConfig.x !== undefined && this._layoutConfig.y !== undefined) {
             this._modelMatrix.translate(this._layoutConfig.x, this._layoutConfig.y);
        }
      }

      this._state = LoadStep.LoadMotion;

      // 콜백
      loadCubismMotion();
    };

    // 모션
    const loadCubismMotion = (): void => {
      this._state = LoadStep.WaitLoadMotion;
      this._model.saveParameters();
      this._allMotionCount = 0;
      this._motionCount = 0;
      const group: string[] = [];

      const motionGroupCount: number = this._modelSetting.getMotionGroupCount();

      // 총 동작 수를 찾습니다
      for (let i = 0; i < motionGroupCount; i++) {
        group[i] = this._modelSetting.getMotionGroupName(i);
        this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
      }

      // 동작을로드합니다
      for (let i = 0; i < motionGroupCount; i++) {
        this.preLoadMotionGroup(group[i]);
      }

      // 동작이없는 경우
      if (motionGroupCount == 0) {
        this._state = LoadStep.LoadTexture;

        // 모든 동작을 중지합니다
        this._motionManager.stopAllMotions();

        this._updating = false;
        this._initialized = true;

        this.createRenderer();
        this.setupTextures();
        this.getRenderer().startUp(this._subdelegate.getGlManager().getGl());
      }
    };
  }

  /**
   * 텍스처를 텍스처 단위로로드하십시오
   */
  private setupTextures(): void {
    // TypeScript
    const usePremultiply = true;

    if (this._state == LoadStep.LoadTexture) {
      // 텍스처로드의 경우
      const textureCount: number = this._modelSetting.getTextureCount();

      for (let modelTextureNumber = 0; modelTextureNumber < textureCount; modelTextureNumber++) {
        // 텍스처 이름이 비어 있으면 부하 바인딩 건너 뛰기
        if (this._modelSetting.getTextureFileName(modelTextureNumber) == '') {
          console.log('getTextureFileName null');
          continue;
        }

        // WebGL의 텍스처 유닛에 텍스처를로드합니다
        let texturePath = this._modelSetting.getTextureFileName(modelTextureNumber);
        texturePath = this._modelHomeDir + texturePath;
        
        // 주의: LAppTextureManager는 Image 객체를 생성하기 위해 path를 씁니다.
        // 메모리 로딩 시에는 Blob URL 등을 사용해야 합니다.
        
        // 여기서 분기 처리가 필요합니다.
        if (this._resources && this._resources.has(texturePath)) {
             // 메모리에서 로드
             const buffer = this._resources.get(texturePath)!;
             const blob = new Blob([buffer]);
             const url = URL.createObjectURL(blob);
             
              const onLoad = (textureInfo: TextureInfo): void => {
                this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);
                this._textureCount++;
                URL.revokeObjectURL(url); // 메모리 해제

                if (this._textureCount >= textureCount) {
                    this._state = LoadStep.CompleteSetup;
                }
              };
              
             this._subdelegate
                .getTextureManager()
                .createTextureFromPngFile(url, usePremultiply, onLoad);
             this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
             
        } else {
             // 기존 네트워크 로드
             const fullPath = this._modelHomeDir + texturePath;
             const onLoad = (textureInfo: TextureInfo): void => {
                this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);
                this._textureCount++;

                if (this._textureCount >= textureCount) {
                    this._state = LoadStep.CompleteSetup;
                }
             };
             
              this._subdelegate
                .getTextureManager()
                .createTextureFromPngFile(fullPath, usePremultiply, onLoad);
              this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
        }
      }

      this._state = LoadStep.WaitLoadTexture;
    }
  }

  /**
   *렌더러를 재건하십시오
   */
  public reloadRenderer(): void {
    this.deleteRenderer();
    this.createRenderer();
    this.setupTextures();
  }

  /**
   * 갱신
   */
  public update(): void {
    if (this._state != LoadStep.CompleteSetup) return;

    const deltaTimeSeconds: number = LAppPal.getDeltaTime();
    this._userTimeSeconds += deltaTimeSeconds;

    this._dragManager.update(deltaTimeSeconds);
    this._dragX = this._dragManager.getX();
    this._dragY = this._dragManager.getY();

    // 모션으로 인해 매개 변수가 업데이트되는지 여부
    let motionUpdated = false;

    // ------------------------------------------------------------------------------------
    this._model.loadParameters(); // 前回セーブされた状態をロード
    if (this._motionManager.isFinished()) {
      // 움직임이 재생되지 않으면 대기 동작에서 무작위로 재생
      this.startRandomMotion(LAppDefine.MotionGroupIdle, LAppDefine.PriorityIdle);
    } else {
      motionUpdated = this._motionManager.updateMotion(this._model, deltaTimeSeconds); // モーションを更新
    }
    this._model.saveParameters(); // 状態を保存
    // ------------------------------------------------------------------------------------


    if (this._expressionManager != null) {
      this._expressionManager.updateMotion(this._model, deltaTimeSeconds); // 表情でパラメータ更新（相対変化）
    }

    // 약물로 인한 변경
    // 드래그하여 얼굴 방향을 조정합니다
    this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30); // -30から30の値を加える
    this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
    this._model.addParameterValueById(this._idParamAngleZ, this._dragX * this._dragY * -30);

    // 드래그하여 신체 방향을 조정합니다
    this._model.addParameterValueById(this._idParamBodyAngleX, this._dragX * 10); // -10から10の値を加える

    // 드래그하여 눈의 방향을 조정합니다
    this._model.addParameterValueById(this._idParamEyeBallX, this._dragX); // -1から1の値を加える
    this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);

    // 호흡 등
    if (this._breath != null) {
      this._breath.updateParameters(this._model, deltaTimeSeconds);
    }

    // 물리 계산 설정
    if (this._physics != null) {
      this._physics.evaluate(this._model, deltaTimeSeconds);
    }

    // --------------------------------------------------------------------------
    // 외부 파라미터 적용 (lerp로 부드럽게 전환) - 립싱크/눈깜빡임 전에 실행
    // --------------------------------------------------------------------------
    this.updateParameterTransitions(deltaTimeSeconds);

    // 립 동기화 설정 (lerp 후에 실행되어 값을 더할 수 있음)
    if (this._lipsync) {
      let value = 0.0; // リアルタイムでリップシンクを行う場合、システムから音量を取得して、0~1の範囲で値を入力します。

      // 1. 외부에서 주입된 립싱크 값 확인
      if (this._userLipSyncValue >= 0) {
        value = this._userLipSyncValue;
        // _userLipSyncValue는 한 프레임에만 유효하도록 초기화하거나 유지할지는 정책 나름.
        // 여기서는 외부에서 매 프레임 넣어준다고 가정하고 유지, 또는 오디오가 끊기면 0이 들어온다고 가정.
      } else {
          // 2. 내부 핸들러 사용 (기존 로직 유지 또는 제거 가능)
          this._wavFileHandler.update(deltaTimeSeconds);
          value = this._wavFileHandler.getRms();

          // WavFileHandler(로컬 파일) 재생 중이 아니면 0
          if (value <= 0.001) {
              value = 0;
          }

          value = Math.sqrt(value) * 0.6;
          value = Math.min(value, 1.0);
      }

      for (let i = 0; i < this._lipSyncIds.getSize(); ++i) {
        this._model.addParameterValueById(this._lipSyncIds.at(i), value, 1.0);
      }

      // ParamJawOpen 파라미터가 있는 경우 (ARKit 호환 모델 등) 립싱크 값 적용
      const jawOpenId = CubismFramework.getIdManager().getId("ParamJawOpen");
      this._model.addParameterValueById(jawOpenId, value, 1.0);
    }

    // 설정 설정
    if (this._pose != null) {
      this._pose.updateParameters(this._model, deltaTimeSeconds);
    }

    // --------------------------------------------------------------------------
    // 눈 깜빡임 (립싱크와 동일한 방식 - 기존 파라미터 값에 더함)
    // --------------------------------------------------------------------------
    const blinkValue = this.updateEyeBlink(deltaTimeSeconds);
    
    // ParamEyeLOpen, ParamEyeROpen 파라미터에 깜빡임 값 적용 (립싱크와 동일한 방식)
    const eyeLOpenId = CubismFramework.getIdManager().getId("ParamEyeLOpen");
    const eyeROpenId = CubismFramework.getIdManager().getId("ParamEyeROpen");
    this._model.addParameterValueById(eyeLOpenId, -blinkValue);
    this._model.addParameterValueById(eyeROpenId, -blinkValue);

    this._model.update();
  }

  /**
   * 외부에서 립싱크 값을 직접 설정
   */
  public setLipSyncValue(value: number): void {
      this._userLipSyncValue = value;
      if (this._userLipSyncValue > 0) {
        this._lipsync = true;
      }
  }
  
  private _userLipSyncValue: number = -1; // -1이면 내부 로직 사용
  private _resources: Map<string, ArrayBuffer> | null = null;
  
  // ============================================================================
  // 파라미터 부드러운 전환 (Lerp) 시스템
  // ============================================================================
  private _parameterTargets: Map<string, number> = new Map<string, number>();   // 목표 값
  private _parameterCurrents: Map<string, number> = new Map<string, number>();  // 현재 값
  private _parameterTransitionSpeed: number = 5.0;  // 전환 속도 (높을수록 빠름)
  
  /**
   * 파라미터 목표 값 설정 (lerp로 부드럽게 전환됨)
   * @param id 파라미터 ID
   * @param targetValue 목표 값
   */
  public setParameterTarget(id: string, targetValue: number): void {
    this._parameterTargets.set(id, targetValue);
    
    // 현재 값이 없으면 모델의 현재 파라미터 값으로 초기화 (0이 아닌 실제 값)
    if (!this._parameterCurrents.has(id)) {
      // 모델에서 현재 파라미터 값 가져오기
      const cubismId = CubismFramework.getIdManager().getId(id);
      const modelCurrentValue = this._model.getParameterValueById(cubismId);
      this._parameterCurrents.set(id, modelCurrentValue);
    }
  }
  
  /**
   * 모든 파라미터를 기본값(0)으로 lerp 전환
   * 현재 설정된 모든 파라미터의 목표값을 0으로 변경
   */
  public clearParameterTargets(): void {
    // 기존 목표값들을 0으로 변경하여 부드럽게 기본 상태로 전환
    this._parameterTargets.forEach((_, id) => {
      this._parameterTargets.set(id, 0);
    });
  }
  
  /**
   * 모든 파라미터 완전 초기화 (목표 + 현재 값 모두, 즉시 리셋)
   */
  public resetAllParameters(): void {
    this._parameterTargets.clear();
    this._parameterCurrents.clear();
  }
  
  /**
   * 전환 속도 설정
   * @param speed 속도 (1~10 권장, 기본값 5)
   */
  public setTransitionSpeed(speed: number): void {
    this._parameterTransitionSpeed = Math.max(0.1, speed);
  }
  
  /**
   * 파라미터 전환 업데이트 (update()에서 호출)
   * 현재 값을 목표 값으로 lerp로 전환
   * 목표값이 0이고 전환 완료 시 맵에서 제거 (다른 시스템이 제어 가능하도록)
   */
  private updateParameterTransitions(deltaTimeSeconds: number): void {
    if (this._parameterTargets.size === 0) return;
    
    const lerpFactor = Math.min(1.0, this._parameterTransitionSpeed * deltaTimeSeconds);
    const idsToRemove: string[] = [];
    
    this._parameterTargets.forEach((targetValue, id) => {
      // 현재 값 가져오기
      let currentValue = this._parameterCurrents.get(id);
      if (currentValue === undefined) {
        // 모델에서 현재 값 가져오기
        const cubismId = CubismFramework.getIdManager().getId(id);
        currentValue = this._model.getParameterValueById(cubismId);
        this._parameterCurrents.set(id, currentValue);
      }
      
      // Lerp: current + (target - current) * factor
      const newValue = currentValue + (targetValue - currentValue) * lerpFactor;
      this._parameterCurrents.set(id, newValue);
      
      // 모델에 적용
      const cubismId = CubismFramework.getIdManager().getId(id);
      this._model.setParameterValueById(cubismId, newValue, 1.0);
      
      // 목표값이 0이고 lerp 완료 시 제거 예약 (다른 시스템이 제어 가능하도록)
      if (targetValue === 0 && Math.abs(newValue) < 0.01) {
        idsToRemove.push(id);
      }
    });
    
    // lerp 완료된 0-목표 파라미터 제거
    idsToRemove.forEach(id => {
      this._parameterTargets.delete(id);
      this._parameterCurrents.delete(id);
    });
  }
  
  // 기존 호환성을 위해 유지 (내부적으로 lerp 시스템 사용)
  /**
   * 파라미터 값 설정 (lerp로 부드럽게 전환됨)
   * @deprecated setParameterTarget() 사용 권장
   */
  public setParameterOverride(id: string, value: number): void {
    this.setParameterTarget(id, value);
  }

  public clearParameterOverrides(): void {
    this.clearParameterTargets();
  }
  
  // ============================================================================
  // 눈 깜빡임 관련 (립싱크와 동일한 구조)
  // ============================================================================
  private _blinkTimer: number = 0;                              // 다음 깜빡임까지 타이머
  private _nextBlinkTime: number = 3.0   // 다음 깜빡임까지 간격 (3초)
  private _isBlinking: boolean = false;                         // 현재 깜빡이는 중인지
  private _blinkPhase: number = 0;                              // 깜빡임 애니메이션 진행 시간
  
  /**
   * 눈 깜빡임 업데이트 (update()에서 호출)
   * 립싱크와 동일한 패턴: 현재 깜빡임으로 인한 눈 감김 정도(0~1)를 반환
   * @param deltaTimeSeconds 프레임 간 시간 차이
   * @returns blinkAmount (0: 눈 뜸, 1: 눈 완전히 감음)
   */
  private updateEyeBlink(deltaTimeSeconds: number): number {
    let blinkAmount = 0.0;
    
    if (!this._isBlinking) {
      // 대기 상태: 다음 깜빡임까지 타이머 증가
      this._blinkTimer += deltaTimeSeconds;
      
      if (this._blinkTimer >= this._nextBlinkTime) {
        // 깜빡임 시작
        this._isBlinking = true;
        this._blinkPhase = 0;
        this._blinkTimer = 0;
      }
    } else {
      // 깜빡임 중: 애니메이션 진행
      this._blinkPhase += deltaTimeSeconds;
      
      const blinkDuration = 0.4;           // 깜빡임 총 시간 (초)
      const closeTime = blinkDuration * 0.4; // 눈 감는 시간 (40%)
      const openTime = blinkDuration * 0.6;  // 눈 뜨는 시간 (60%)
      
      if (this._blinkPhase < closeTime) {
        // 눈 감는 중: 0 → 1
        blinkAmount = this._blinkPhase / closeTime;
      } else if (this._blinkPhase < blinkDuration) {
        // 눈 뜨는 중: 1 → 0
        blinkAmount = 1.0 - ((this._blinkPhase - closeTime) / openTime);
      } else {
        // 깜빡임 완료: 다음 깜빡임 예약
        this._isBlinking = false;
        this._blinkPhase = 0;
        this._nextBlinkTime = 2.0 + Math.random() * 3.0;
        blinkAmount = 0.0;
      }
    }
    
    return blinkAmount;
  }

  /**
   * 모델 설정 가져오기
   */
  public getModelSetting(): ICubismModelSetting {
    return this._modelSetting;
  }

  /**
   * 인수에 의해 지정된 모션 재생 시작
   * @param 그룹 모션 그룹 이름
   * @param 그룹에 번호가 없습니다
   * @param 우선 순위
   * @param onfinishedMotionHandler 콜백 함수 모션 재생이 완료되었을 때 호출됩니다.
   * @return은 시작된 동작의 식별 번호를 반환합니다. 개별 운동이 완료되었는지 여부를 결정하기 위해 isfinished ()의 주장으로 사용됩니다. 시작할 수 없다면 [-1]
   */
  public startMotion(
    group: string,
    no: number,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (priority == LAppDefine.PriorityForce) {
      this._motionManager.setReservePriority(priority);
    } else if (!this._motionManager.reserveMotion(priority)) {
      if (this._debugMode) {
        LAppPal.printMessage("[APP]can't start motion.");
      }
      return InvalidMotionQueueEntryHandleValue;
    }

    const motionFileName = this._modelSetting.getMotionFileName(group, no);

    // ex) idle_0
    const name = `${group}_${no}`;
    let motion: CubismMotion = this._motions.getValue(name) as CubismMotion;
    let autoDelete = false;

    if (motion == null) {
      this.getFile(motionFileName)
        .then(arrayBuffer => {
          motion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            null,
            onFinishedMotionHandler,
            onBeganMotionHandler,
            this._modelSetting,
            group,
            no,
            this._motionConsistency
          );
        })
        .catch(() => {
            CubismLogError(`Failed to load file ${motionFileName}`);
        });

      if (motion) {
        motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
        autoDelete = true; // 終了時にメモリから削除
      } else {
        CubismLogError("Can't start motion {0} .", motionFileName);
        // 로드 할 수없는 동작에 대한 ReservePriority를 재설정
        this._motionManager.setReservePriority(LAppDefine.PriorityNone);
        return InvalidMotionQueueEntryHandleValue;
      }
    } else {
      motion.setBeganMotionHandler(onBeganMotionHandler);
      motion.setFinishedMotionHandler(onFinishedMotionHandler);
    }

    //목소리
    const voice = this._modelSetting.getMotionSoundFileName(group, no);
    if (voice.localeCompare('') != 0) {
      let path = voice;
      path = this._modelHomeDir + path;
      this._wavFileHandler.start(path);
    }

    if (this._debugMode) {
      LAppPal.printMessage(`[APP]start motion: [${group}_${no}]`);
    }
    return this._motionManager.startMotionPriority(motion, autoDelete, priority);
  }

  /**
   * 무작위로 선택된 동작을 시작합니다.
   * @param 그룹 모션 그룹 이름
   * @param 우선 순위
   * @param onfinishedMotionHandler 콜백 함수 모션 재생이 완료되었을 때 호출됩니다.
   * @return은 시작된 동작의 식별 번호를 반환합니다. 개별 운동이 완료되었는지 여부를 결정하기 위해 isfinished ()의 주장으로 사용됩니다. 시작할 수 없다면 [-1]
   */
  public startRandomMotion(
    group: string,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (this._modelSetting.getMotionCount(group) == 0) {
      return InvalidMotionQueueEntryHandleValue;
    }

    const no: number = Math.floor(Math.random() * this._modelSetting.getMotionCount(group));

    return this.startMotion(group, no, priority, onFinishedMotionHandler, onBeganMotionHandler);
  }

  /**
   * 인수에 의해 지정된 얼굴 표정 운동 설정
   *
   * @param expressionid 표현 모션 ID
   */
  public setExpression(expressionId: string): void {
    const motion: ACubismMotion = this._expressions.getValue(expressionId);

    if (this._debugMode) {
      LAppPal.printMessage(`[APP]expression: [${expressionId}]`);
    }

    if (motion != null) {
      this._expressionManager.startMotion(motion, false);
    } else {
      if (this._debugMode) {
        LAppPal.printMessage(`[APP]expression[${expressionId}] is null`);
      }
    }
  }

  /**
   * 무작위로 선택된 얼굴 운동을 설정합니다
   */
  public setRandomExpression(): void {
    if (this._expressions.getSize() == 0) {
      return;
    }

    const no: number = Math.floor(Math.random() * this._expressions.getSize());

    for (let i = 0; i < this._expressions.getSize(); i++) {
      if (i == no) {
        const name: string = this._expressions._keyValues[i].first;
        this.setExpression(name);
        return;
      }
    }
  }

  /**
   *이벤트 화재를 받으십시오
   */
  public motionEventFired(eventValue: csmString): void {
    CubismLogInfo('{0} is fired on LAppModel!!', eventValue.s);
  }

  /**
   *도마 테스트
   * 사각형은 지정된 ID의 정점 목록에서 계산되며 좌표가 사각형 범위 내에 있는지 확인합니다.
   *
   * @param hitarenaname ID가 적중 감지를 테스트합니다
   * @param x x는 판단을 내리기 위해 좌표를 조정합니다
   * @param y y 판결을 내리기 위해 조정하십시오
   */
  public hitTest(hitArenaName: string, x: number, y: number): boolean {
    // 투명 할 때 히트 감지가 없습니다.
    if (this._opacity < 1) {
      return false;
    }

    const count: number = this._modelSetting.getHitAreasCount();

    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
        const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i);
        return this.isHit(drawId, x, y);
      }
    }

    return false;
  }

  /**
   * 그룹 이름에서 모션 데이터를 대량으로로드합니다.
   * 모션 데이터의 이름은 ModelSetting에서 내부적으로 얻습니다.
   *
   * @param 그룹 모션 데이터 그룹 이름
   */
  public preLoadMotionGroup(group: string): void {
    for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
      const motionFileName = this._modelSetting.getMotionFileName(group, i);

      // ex) idle_0
      const name = `${group}_${i}`;
      if (this._debugMode) {
        LAppPal.printMessage(`[APP]load motion: ${motionFileName} => [${name}]`);
      }

      this.getFile(motionFileName)
        .then(arrayBuffer => {
          const tmpMotion: CubismMotion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            name,
            null,
            null,
            this._modelSetting,
            group,
            i,
            this._motionConsistency
          );

          if (tmpMotion != null) {
            tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);

            if (this._motions.getValue(name) != null) {
              ACubismMotion.delete(this._motions.getValue(name));
            }

            this._motions.setValue(name, tmpMotion);

            this._motionCount++;
          } else {
            // loadMotion이 불가능한 경우 총 동작 수가 이동하므로 하나씩 줄입니다.
            this._allMotionCount--;
          }

          if (this._motionCount >= this._allMotionCount) {
            this._state = LoadStep.LoadTexture;

            // 모든 동작을 중지합니다
            this._motionManager.stopAllMotions();

            this._updating = false;
            this._initialized = true;

            this.createRenderer();
            this.setupTextures();
            this.getRenderer().startUp(this._subdelegate.getGlManager().getGl());
          }
        });
    }
  }

  /**
   * 모든 모션 데이터를 자유롭게하십시오.
   */
  public releaseMotions(): void {
    this._motions.clear();
  }

  /**
   * 모든 얼굴 표현 데이터를 해제합니다.
   */
  public releaseExpressions(): void {
    this._expressions.clear();
  }

  /**
   * 모델 그리기 프로세스. 모델을 그리려는 공간에 대한 뷰 프로젝션 매트릭스를 전달하십시오.
   */
  public doDraw(): void {
    if (this._model == null) return;

    // 캔버스 크기를 전달합니다
    const canvas = this._subdelegate.getCanvas();
    const viewport: number[] = [0, 0, canvas.width, canvas.height];

    this.getRenderer().setRenderState(this._subdelegate.getFrameBuffer(), viewport);
    this.getRenderer().drawModel();
  }

  /**
   * 모델 그리기 프로세스. 모델을 그리려는 공간에 대한 뷰 프로젝션 매트릭스를 전달하십시오.
   */
  public draw(matrix: CubismMatrix44): void {
    if (this._model == null) {
      return;
    }

    // 각 로딩이 완료된 후
    if (this._state == LoadStep.CompleteSetup) {
      matrix.multiplyByMatrix(this._modelMatrix);

      this.getRenderer().setMvpMatrix(matrix);

      this.doDraw();
    }
  }

  public async hasMocConsistencyFromFile() {
    CSM_ASSERT(this._modelSetting.getModelFileName().localeCompare(``));

    // CubismModel
    if (this._modelSetting.getModelFileName() != '') {
      const modelFileName = this._modelSetting.getModelFileName();

      const response = await fetch(`${this._modelHomeDir}${modelFileName}`);
      const arrayBuffer = await response.arrayBuffer();

      this._consistency = CubismMoc.hasMocConsistency(arrayBuffer);

      if (!this._consistency) {
        CubismLogInfo('Inconsistent MOC3.');
      } else {
        CubismLogInfo('Consistent MOC3.');
      }

      return this._consistency;
    } else {
      LAppPal.printMessage('Model data does not exist.');
    }
  }

  public setSubdelegate(subdelegate: LAppSubdelegate): void {
    this._subdelegate = subdelegate;
  }

  /**
   * 음성 파일을 재생하고 립싱크를 시작한다
   * @param voiceFileName 음성 파일 경로 (모델 디렉토리 기준 상대 경로)
   */
  public startVoice(voiceFileName: string): void {
    const voicePath = `${this._modelHomeDir}${voiceFileName}`;
    console.log(voicePath);
    if (this._debugMode) {
      LAppPal.printMessage(`[APP]start voice: ${voicePath}`);
    }

    this._wavFileHandler.start(voicePath);
    this.playAudio(voicePath);
  }

  /**
   * オーディオを実際に再生する
   * @param audioPath オーディオファイルのパス
   */
  private playAudio(audioPath: string): void {
    // 기존 오디오가 재생 중이면 정지
    if (this._audio) {
      this._audio.pause();
      this._audio = null;
    }

    // 새 오디오 재생
    this._audio = new Audio(audioPath);
    this._audio.play().catch(error => {
      LAppPal.printMessage(`[APP]Audio play error: ${error}`);
    });

    if (this._debugMode) {
      LAppPal.printMessage(`[APP]Playing audio: ${audioPath}`);
    }
  }
  /**
   * 생성자
   */
  public constructor() {
    super();

    this._modelSetting = null;
    this._modelHomeDir = null;
    this._userTimeSeconds = 0.0;

    this._eyeBlinkIds = new csmVector<CubismIdHandle>();
    this._lipSyncIds = new csmVector<CubismIdHandle>();

    this._motions = new csmMap<string, ACubismMotion>();
    this._expressions = new csmMap<string, ACubismMotion>();

    this._hitArea = new csmVector<csmRect>();
    this._userArea = new csmVector<csmRect>();

    this._idParamAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleX
    );
    this._idParamAngleY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleY
    );
    this._idParamAngleZ = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleZ
    );
    this._idParamEyeBallX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallX
    );
    this._idParamEyeBallY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallY
    );
    this._idParamBodyAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamBodyAngleX
    );

    if (LAppDefine.MOCConsistencyValidationEnable) {
      this._mocConsistency = true;
    }

    if (LAppDefine.MotionConsistencyValidationEnable) {
      this._motionConsistency = true;
    }

    this._state = LoadStep.LoadAssets;
    this._expressionCount = 0;
    this._textureCount = 0;
    this._motionCount = 0;
    this._allMotionCount = 0;
    this._wavFileHandler = new LAppWavFileHandler();
    this._consistency = false;
  }

  private _subdelegate: LAppSubdelegate;

  _modelSetting: ICubismModelSetting; // モデルセッティング情報
  _modelHomeDir: string; // モデルセッティングが置かれたディレクトリ
  _userTimeSeconds: number; // デルタ時間の積算値[秒]

  _eyeBlinkIds: csmVector<CubismIdHandle>; // モデルに設定された瞬き機能用パラメータID
  _lipSyncIds: csmVector<CubismIdHandle>; // モデルに設定されたリップシンク機能用パラメータID

  _motions: csmMap<string, ACubismMotion>; // 読み込まれているモーションのリスト
  _expressions: csmMap<string, ACubismMotion>; // 読み込まれている表情のリスト

  _hitArea: csmVector<csmRect>;
  _userArea: csmVector<csmRect>;

  _idParamAngleX: CubismIdHandle; // パラメータID: ParamAngleX
  _idParamAngleY: CubismIdHandle; // パラメータID: ParamAngleY
  _idParamAngleZ: CubismIdHandle; // パラメータID: ParamAngleZ
  _idParamEyeBallX: CubismIdHandle; // パラメータID: ParamEyeBallX
  _idParamEyeBallY: CubismIdHandle; // パラメータID: ParamEyeBAllY
  _idParamBodyAngleX: CubismIdHandle; // パラメータID: ParamBodyAngleX

  _state: LoadStep; // 現在のステータス管理用
  _expressionCount: number; // 表情データカウント
  _textureCount: number; // テクスチャカウント
  _motionCount: number; // モーションデータカウント
  _allMotionCount: number; // モーション総数
  _wavFileHandler: LAppWavFileHandler; //wavファイルハンドラ
  _consistency: boolean; // MOC3整合性チェック管理用
  private _audio: HTMLAudioElement | null = null;
}
