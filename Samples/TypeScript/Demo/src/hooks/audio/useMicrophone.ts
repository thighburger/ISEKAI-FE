import { useEffect, useRef, useCallback, useState } from 'react';

interface UseMicrophoneOptions {
  sampleRate?: number;
  onAudioData?: (data: Float32Array) => void;
}

interface UseMicrophoneReturn {
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * 마이크 훅 (Gemini Live용)
 * VAD는 서버에서 처리하므로 클라이언트는 순수 오디오만 전송
 */
export const useMicrophone = ({
  sampleRate = 16000,
  onAudioData
}: UseMicrophoneOptions = {}): UseMicrophoneReturn => {
  const [isActive, setIsActive] = useState(false);

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

      // AudioWorklet 로드
      await audioContext.audioWorklet.addModule('vad-audio-processor.js');

      const workletNode = new AudioWorkletNode(audioContext, 'vad-audio-processor');
      workletNodeRef.current = workletNode;

      // 메시지 핸들러 - 오디오 데이터만 처리
      workletNode.port.onmessage = event => {
        if (event.data.type === 'audio') {
          onAudioDataRef.current?.(event.data.buffer);
        }
      };

      source.connect(workletNode);

      setIsActive(true);
      console.log('[Microphone] 활성화됨');
    } catch (error) {
      console.error('[Microphone] 시작 실패:', error);
      throw error;
    }
  }, [sampleRate]);

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

  return { isActive, start, stop };
};
