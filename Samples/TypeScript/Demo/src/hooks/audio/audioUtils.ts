/**
 * 오디오 유틸리티 함수들
 * 클래스 없이 순수 함수로 구현
 */

/**
 * Float32 배열을 Int16 배열로 변환
 */
export const float32ToInt16 = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
};

/**
 * Int16 배열을 Float32 배열로 변환
 */
export const int16ToFloat32 = (int16Array: Int16Array): Float32Array => {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
};

/**
 * WAV 헤더 파싱
 */
export interface WavHeader {
  channels: number;
  sampleRate: number;
  pcmData: ArrayBuffer;
}

export const parseWavHeader = (buffer: ArrayBuffer): WavHeader | null => {
  if (buffer.byteLength < 44) return null;

  const view = new DataView(buffer);

  // RIFF 헤더 확인
  if (view.getUint32(0, false) !== 0x52494646) return null;

  try {
    const channels = view.getUint16(22, true);
    const sampleRate = view.getUint32(24, true);

    if (channels > 0 && channels <= 2 && sampleRate >= 8000 && sampleRate <= 96000) {
      return {
        channels,
        sampleRate,
        pcmData: buffer.slice(44)
      };
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * RMS 계산
 */
export const calculateRms = (analyser: AnalyserNode, dataArray: Uint8Array): number => {
  analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }

  const average = sum / dataArray.length;
  return (average / 256) * 2.5;
};
