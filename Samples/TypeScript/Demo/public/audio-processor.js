class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // 버퍼 크기 (작을수록 지연↓, 부하↑)
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];

      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex++] = inputChannel[i];

        // 버퍼가 가득 차면 메인 스레드로 전송
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage(this.buffer.slice());
          this.bufferIndex = 0;
        }
      }
    }

    return true; // 프로세서 계속 실행
  }
}

registerProcessor('audio-processor', AudioProcessor);