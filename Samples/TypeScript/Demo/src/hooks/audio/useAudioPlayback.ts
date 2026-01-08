import { useEffect, useRef, useCallback, useState } from 'react';
import { parseWavHeader, int16ToFloat32, calculateRms } from './audioUtils';

interface UseAudioPlaybackReturn {
  isReady: boolean;
  playAudio: (buffer: ArrayBuffer) => void;
  getCurrentRms: () => number;
}

/**
 * 오디오 재생을 관리하는 훅
 */
export const useAudioPlayback = (playbackSampleRate = 48000): UseAudioPlaybackReturn => {
  const [isReady, setIsReady] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSettingsRef = useRef({ channels: 1, sampleRate: 24000 });

  // 컴포넌트 마운트 시 즉시 초기화
  useEffect(() => {
    const audioContext = new AudioContext({ sampleRate: playbackSampleRate });
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    audioContextRef.current = audioContext;
    analyserNodeRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    setIsReady(true);
    console.log('[AudioPlayback] 초기화 완료, sampleRate:', playbackSampleRate);

    return () => {
      analyser.disconnect();
      audioContext.close();
      console.log('[AudioPlayback] AudioContext 종료 (언마운트)');
    };
  }, [playbackSampleRate]);

  // 오디오 재생
  const playAudio = useCallback((buffer: ArrayBuffer) => {
    if (buffer.byteLength === 0) {
      console.log('[AudioPlayback] 빈 버퍼 수신');
      return;
    }

    const audioContext = audioContextRef.current;
    const analyserNode = analyserNodeRef.current;

    if (!audioContext || !analyserNode) {
      console.warn('[AudioPlayback] 초기화되지 않음');
      return;
    }

    console.log(`[AudioPlayback] 버퍼 수신: ${buffer.byteLength} bytes`);

    let pcmData = buffer;

    // WAV 헤더 파싱
    const wavHeader = parseWavHeader(buffer);
    if (wavHeader) {
      audioSettingsRef.current = {
        channels: wavHeader.channels,
        sampleRate: wavHeader.sampleRate
      };
      pcmData = wavHeader.pcmData;
      console.log(
        `[AudioPlayback] WAV 파싱: ${wavHeader.channels}ch, ${wavHeader.sampleRate}Hz, PCM ${pcmData.byteLength}bytes`
      );
    } else {
      console.warn('[AudioPlayback] WAV 헤더 파싱 실패, raw PCM으로 처리');
    }

    if (pcmData.byteLength === 0) return;

    // PCM 데이터 변환
    const int16Data = new Int16Array(pcmData);
    const float32Data = int16ToFloat32(int16Data);

    const { channels, sampleRate } = audioSettingsRef.current;
    const frameCount = float32Data.length / channels;

    console.log(`[AudioPlayback] 재생 준비: ${frameCount}프레임, ${channels}ch, ${sampleRate}Hz`);

    // AudioBuffer 생성
    const audioBuffer = audioContext.createBuffer(channels, frameCount, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = float32Data[i * channels + channel];
      }
    }

    // 재생 스케줄링
    const currentTime = audioContext.currentTime;

    // 첫 청크이거나 지연된 경우 즉시 재생, 아니면 연속 재생
    let startTime;
    if (nextStartTimeRef.current === 0 || nextStartTimeRef.current < currentTime) {
      startTime = currentTime + 0.01; // 약간의 버퍼
      console.log('[AudioPlayback] 새 스트림 시작 또는 재동기화');
    } else {
      startTime = nextStartTimeRef.current;
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyserNode);
    analyserNode.connect(audioContext.destination);
    source.start(startTime);

    console.log(
      `[AudioPlayback] 재생: ${startTime.toFixed(3)}초 시작, ${audioBuffer.duration.toFixed(3)}초 길이, 다음: ${(startTime + audioBuffer.duration).toFixed(3)}초`
    );

    nextStartTimeRef.current = startTime + audioBuffer.duration;
  }, []);

  // RMS 값 가져오기
  const getCurrentRms = useCallback((): number => {
    if (!analyserNodeRef.current || !dataArrayRef.current) return 0;
    return calculateRms(analyserNodeRef.current, dataArrayRef.current);
  }, []);

  return { isReady, playAudio, getCurrentRms };
};
