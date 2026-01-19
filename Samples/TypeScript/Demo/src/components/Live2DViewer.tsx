import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { useLive2D } from '../hooks/useLive2D';
import { MotionMapItem } from '@/live2d-library/lapplive2dmanager';

interface Live2DViewerProps {
  modelUrl: string;
  getLipSyncValue?: () => number;
  expression?: string;           // 감정 (예: "행복", "슬픔")
  motion?: string;               // 모션 이름 (예: "인사", "끄덕임")
  zoom?: number;                 // 줌 레벨 (1.0 = 기본, 2.0 = 200% 확대)
  // 외부에서 config 전달 (ZIP 내부에 config.json이 없을 경우 사용)
  motionMap?: { [key: string]: MotionMapItem };
  setparameter?: { [key: string]: number };
}

const Live2DViewer = ({ 
  modelUrl, 
  getLipSyncValue, 
  expression="중립",
  motion="대기",
  zoom=1.0
}: Live2DViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resources, setResources] = useState<Map<string, ArrayBuffer> | undefined>(undefined);
  const [modelInfo, setModelInfo] = useState<{ path: string; fileName: string } | null>(null);

  // ZIP 파일 로드
  useEffect(() => {
    const fetchZip = async () => {
      if (!modelUrl) return;
      try {
        const response = await axios.get(modelUrl, { responseType: 'arraybuffer' });
        const zip = await JSZip.loadAsync(response.data);
        const resMap = new Map<string, ArrayBuffer>();
        let fullModel3Path = '';

        for (const filePath of Object.keys(zip.files)) {
          if (zip.files[filePath].dir) continue;
          // macOS 숨김 파일 및 메타데이터 폴더 무시
          if (filePath.includes('__MACOSX') || filePath.split('/').pop()?.startsWith('._'))
            continue;
          const content = await zip.files[filePath].async('arraybuffer');
          resMap.set(filePath, content);
          if (filePath.endsWith('.model3.json')) fullModel3Path = filePath;
        }

        let rootDir = '';
        let fileName = fullModel3Path;
        const parts = fullModel3Path.split('/');
        if (parts.length > 1) {
          rootDir = parts.slice(0, parts.length - 1).join('/') + '/';
          fileName = parts[parts.length - 1];
        }

        setResources(resMap);
        setModelInfo({ path: rootDir, fileName: fileName });
      } catch (error) {
        console.error('[Live2DViewer] Failed to load zip:', error);
      }
    };
    fetchZip();
  }, [modelUrl]);

  // Live2D 매니저 초기화
  const { manager } = useLive2D({
    containerRef,
    modelPath: modelInfo?.path || '',
    modelFileName: modelInfo?.fileName || '',
    resources: resources,
    getLipSyncValue
  });


  // 기본 motionMap (하드코딩)
  const DEFAULT_MOTION_MAP = {
    "기본": { group: "idle", index: 0 },
    "듣기": { group: "listen", index: 1 },
    "말하기": { group: "speak", index: 1 },
    "생각": { group: "think", index: 0 }
  };

  // config 적용 (ZIP 내부 config.json 또는 기본값 사용)
  useEffect(() => {
    if (!manager || !resources) return;

    const loadAndApplyConfig = async () => {
      let configData: any = null;

      // Resources (ZIP)에서 config.json 찾기
      const configPath = Array.from(resources.keys()).find(key => key.endsWith('config.json'));

      if (configPath) {
        try {
          const content = resources.get(configPath);
          if (content) {
            const text = new TextDecoder().decode(content);
            configData = JSON.parse(text);
          }
        } catch (e) {
          console.error('[Live2DViewer] Failed to parse config.json from resources:', e);
        }
      }

      // config.json에 motionMap이 없으면 기본값 병합
      if (configData && !configData.motionMap) {
        configData.motionMap = DEFAULT_MOTION_MAP;
        console.log('[Live2DViewer] motionMap not found in config, using default');
      }

      // config 전체를 manager에 전달 (motionMap 포함)
      manager.setModelConfig(configData);
      
      // 파라미터 적용
      if (configData.setparameter) {
        const parameters = configData.setparameter;
        for (let param in parameters) {
          manager.setParameterValue(param, parameters[param]);
        }
      }
    };

    loadAndApplyConfig();
  }, [manager, resources]);

  // 감정 변화 감지 및 적용
  useEffect(() => {
    if (manager && expression) {
      manager.applyEmotion(expression);
    }
  }, [manager, expression]);

  // 모션 재생 (motion prop이 변경될 때)
  useEffect(() => {
    if (manager && motion) {
      console.log(`[Live2DViewer] Playing motion: ${motion}`);
      manager.playMappedMotion(motion);
    }
  }, [manager, motion]);

  // 줌 레벨 적용 (zoom prop이 변경될 때)
  useEffect(() => {
    if (manager) {
      manager.setZoom(zoom);
    }
  }, [manager, zoom]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Live2DViewer;
