import { useEffect, useRef, useCallback, useState } from 'react';

interface UseMicrophoneOptions {
  sampleRate?: number;
  vadThreshold?: number;
  noiseGate?: number;
  onAudioData?: (data: Float32Array) => void;
}

interface UseMicrophoneReturn {
  isActive: boolean;
  isVoiceDetected: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export const useMicrophone = ({
  sampleRate = 16000,
  vadThreshold = 0.015,
  noiseGate = 0.005,
  onAudioData
}: UseMicrophoneOptions = {}): UseMicrophoneReturn => {
  const [isActive, setIsActive] = useState(false);
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const onAudioDataRef = useRef(onAudioData);

  // 콜백 ref 업데이트
  useEffect(() => {
    onAudioDataRef.current = onAudioData;
  }, [onAudioData]);

  const start = useCallback(async () => {
    if (audioContextRef.current) {
      console.log('[Microphone] 이미 활성화됨');
      return;
    }

    try {
      console.log('[Microphone] 마이크 접근 요청...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // VAD AudioWorklet 로드
      await audioContext.audioWorklet.addModule('vad-audio-processor.js');

      const workletNode = new AudioWorkletNode(audioContext, 'vad-audio-processor');
      workletNodeRef.current = workletNode;

      // VAD 설정 전송
      workletNode.port.postMessage({
        type: 'config',
        vadThreshold,
        noiseGate
      });

      // 메시지 핸들러
      workletNode.port.onmessage = event => {
        if (event.data.type === 'stats') {
          setIsVoiceDetected(event.data.isActive);
        } else if (event.data.type === 'audio') {
          // AudioWorklet에서 이미 VAD 처리됨
          if (event.data.isActive) {
            onAudioDataRef.current?.(event.data.buffer);
          }
        }
      };

      source.connect(workletNode);

      setIsActive(true);
      console.log('[Microphone] 활성화됨');
    } catch (error) {
      console.error('[Microphone] 시작 실패:', error);
      throw error;
    }
  }, [sampleRate, vadThreshold, noiseGate]);

  const stop = useCallback(async () => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current.port.close();
      workletNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsActive(false);
    setIsVoiceDetected(false);
    console.log('[Microphone] 중지됨');
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        stop();
      }
    };
  }, []);

  return { isActive, isVoiceDetected, start, stop };
};
