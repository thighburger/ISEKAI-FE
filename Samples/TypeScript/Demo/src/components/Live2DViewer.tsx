import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { useLive2D } from '../hooks/useLive2D';
import { Live2DModelConfig } from '../live2d-library/lapplive2dmanager';

interface Live2DViewerProps {
  modelUrl: string; // ZIP URL
  modelConfig?: Live2DModelConfig;
  webSocketUrl?: string;
}

const Live2DViewer = ({ modelUrl, modelConfig, webSocketUrl }: Live2DViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [resources, setResources] = useState<Map<string, ArrayBuffer> | undefined>(undefined);
  const [modelInfo, setModelInfo] = useState<{ path: string; fileName: string } | null>(null);

  // 1. Fetch and Parse ZIP
  useEffect(() => {
    const fetchZip = async () => {
      if (!modelUrl) return;

      try {
        console.log(`[Live2DViewer] Fetching zip: ${modelUrl}`);
        const response = await axios.get(modelUrl, { responseType: 'arraybuffer' });
        const zipData = response.data;
        const zip = await JSZip.loadAsync(zipData);

        const resMap = new Map<string, ArrayBuffer>();
        let fullModel3Path = '';

        const filePaths = Object.keys(zip.files);
        for (const filePath of filePaths) {
          const file = zip.files[filePath];
          if (file.dir) continue;

          const content = await file.async('arraybuffer');
          resMap.set(filePath, content);

          if (filePath.endsWith('.model3.json')) {
            fullModel3Path = filePath;
          }
        }

        if (!fullModel3Path) {
          console.error('[Live2DViewer] No .model3.json found in zip.');
          return;
        }

        // Determine root directory and filename
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

  // 2. Use Live2D Hook
  const { manager } = useLive2D({
    containerRef,
    modelConfig,
    modelPath: modelInfo?.path || '',
    modelFileName: modelInfo?.fileName || '',
    resources: resources
  });

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
};

export default Live2DViewer;
