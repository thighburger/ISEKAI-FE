/**
 * 오디오 프로세서 (Gemini Live용)
 * VAD는 서버에서 처리하므로 클라이언트는 순수 오디오만 전송
 */
class VadAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;

    this.port.onmessage = (event) => {
      // 설정 메시지 처리 (호환성 유지)
      if (event.data.type === 'config') {
        // 서버에서 VAD 처리하므로 클라이언트 설정은 무시
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];

    if (input.length > 0 && input[0]) {
      const inputData = input[0];

      for (let i = 0; i < inputData.length; i++) {
        this.buffer[this.bufferIndex++] = inputData[i];

        if (this.bufferIndex >= this.bufferSize) {
          // 항상 오디오 전송
          this.port.postMessage({ type: 'audio', buffer: this.buffer.slice() });
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('vad-audio-processor', VadAudioProcessor);