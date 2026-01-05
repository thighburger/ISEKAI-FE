import { useEffect, useRef, useState } from 'react';
import { LAppLive2DManager, Live2DModelConfig } from '../live2d-library/lapplive2dmanager';
import { LAppSubdelegate } from '../live2d-library/lappsubdelegate';
import { LAppDelegate } from '../live2d-library/lappdelegate';
import { LAppPal } from '../live2d-library/lapppal';
import { Live2DCubismFramework as live2dcubismframework } from '@framework/live2dcubismframework';
import CubismFramework = live2dcubismframework.CubismFramework;

interface UseLive2DProps {
  containerRef: React.RefObject<HTMLElement>;
  modelConfig: Live2DModelConfig;
  modelPath: string; // e.g. "Resources/HoshinoAi/" or root dir in zip
  modelFileName: string; // e.g. "HoshinoAi.model3.json"
  resources?: Map<string, ArrayBuffer>;
}

export const useLive2D = ({
  containerRef,
  modelConfig,
  modelPath,
  modelFileName,
  resources
}: UseLive2DProps) => {
  const [manager, setManager] = useState<LAppLive2DManager | null>(null);
  const subdelegateRef = useRef<LAppSubdelegate | null>(null);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current || !modelFileName) return;

    // 1. Initialize Framework (Global)
    if (LAppDelegate.getInstance().initialize() === false) {
      console.error('Failed to initialize Live2D Framework');
      return;
    }

    // 2. Initialize Canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerRef.current.appendChild(canvas);

    // 3. Initialize Subdelegate
    const subdelegate = new LAppSubdelegate();
    const isInitialized = subdelegate.initialize(canvas);

    if (!isInitialized) {
      console.error('Failed to initialize Live2D Subdelegate');
      return;
    }

    subdelegateRef.current = subdelegate;

    // 4. Get Manager and Load Model
    const live2dManager = subdelegate.getLive2DManager();
    live2dManager.setModelConfig(modelConfig);

    if (resources) {
      live2dManager.loadModelFromResources(resources, modelPath, modelFileName);
    } else {
      live2dManager.loadModel(modelPath, modelFileName);
    }

    setManager(live2dManager);

    // 5. Start Loop
    LAppPal.updateTime(); // Prime the timer to set initial time

    const animate = () => {
      LAppPal.updateTime(); // Calculate delta time for this frame
      if (subdelegateRef.current) {
        subdelegateRef.current.onResize(); // Ensure canvas size is correct
        subdelegateRef.current.update();
        requestRef.current = requestAnimationFrame(animate);
      }
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (subdelegateRef.current) {
        subdelegateRef.current.release();
        subdelegateRef.current = null;
      }
      if (containerRef.current && canvas.parentNode === containerRef.current) {
        containerRef.current.removeChild(canvas);
      }
    };
  }, [containerRef, modelPath, modelFileName, resources]); // Re-run if model changes

  return {
    manager
  };
};
