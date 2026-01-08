import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { useLive2D } from '../hooks/useLive2D';

interface Live2DViewerProps {
  modelUrl: string;
  getLipSyncValue?: () => number;
}

const Live2DViewer = ({ modelUrl, getLipSyncValue }: Live2DViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resources, setResources] = useState<Map<string, ArrayBuffer> | undefined>(undefined);
  const [modelInfo, setModelInfo] = useState<{ path: string; fileName: string } | null>(null);

  // 2. ZIP 파일 로드 (기존 로직 동일)
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

  // 3. Live2D 매니저 초기화
  const { manager } = useLive2D({
    containerRef,
    modelPath: modelInfo?.path || '',
    modelFileName: modelInfo?.fileName || '',
    resources: resources,
    getLipSyncValue
  });

  // 5. config.json 로드 및 파라미터 적용
  useEffect(() => {
    if (!manager || !resources) return;

    const loadAndApplyConfig = async () => {
      let configData: any = null;

      // 1. Resources (ZIP)에서 config.json 찾기
      const configPath = Array.from(resources.keys()).find(key => key.endsWith('config.json'));

      if (configPath) {
        try {
          const content = resources.get(configPath);
          if (content) {
            const text = new TextDecoder().decode(content);
            configData = JSON.parse(text);
            console.log('configData', configData);
          }
        } catch (e) {
          console.error('[Live2DViewer] Failed to parse config.json from resources:', e);
        }
      }
      // 2. 없으면 modelURL 경로 기준으로 fetch 시도 (옵션)
      else if (modelUrl) {
        // modelUrl이 .zip으로 끝난다면, 같은 폴더의 config.json을 찾거나 해야 함.
        // 여기서는 ZIP 내부에 있을 확률이 높으므로 생략하거나, 필요시 구현.
      }

      if (configData && configData.setparameter) {
        const parameters = configData.setparameter;
        console.log('[Live2DViewer] Applying parameters from config.json:', parameters);

        // 이제 manager가 값을 기억하므로 루프 없이 한 번만 설정하면 됩니다.
        for (let param in parameters) {
          console.log(`Setting parameter: ${param} = ${parameters[param]}`);
          manager.setParameterValue(param, parameters[param]);
        }
      }
    };

    loadAndApplyConfig();
  }, [manager, resources]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
};

export default Live2DViewer;
