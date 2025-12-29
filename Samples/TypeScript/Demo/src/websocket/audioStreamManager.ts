export class AudioStreamManager {
  // 송신용 (마이크 -> 서버)
  private sendAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  
  // 수신용 (서버 -> 스피커)
  private receiveAudioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private nextStartTime: number = 0;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  // 현재 수신 오디오 설정
  private currentChannels: number = 1;
  private currentSampleRate: number = 24000;

  // VAD (Voice Activity Detection) 설정
  private vadThreshold: number = 0.015; // 음성 감지 임계값
  private noiseGate: number = 0.005; // 노이즈 게이트
  private isVoiceActive: boolean = false;
  private energyHistory: number[] = [];
  private readonly historySize: number = 10;

  constructor() {}

  /**
   * 마이크 스트리밍 시작 (송신) - VAD + 노이즈 게이트 적용
   * @param onAudioData - 오디오 데이터를 받을 콜백 함수
   */
  public async startMicrophoneStreaming(
    onAudioData: (data: Float32Array) => void
  ): Promise<void> {
    if (this.sendAudioContext && this.mediaStream) {
      console.log('[Audio] 이미 마이크 스트리밍 중입니다.');
      return;
    }

    try {
      console.log('[Audio] 마이크 접근 요청...');

      // 마이크 권한 요청
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true, // 브라우저 내장 노이즈 억제
          autoGainControl: true,
        },
      });

      console.log('[Audio] 마이크 접근 허용됨');

      // AudioContext 생성
      this.sendAudioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.sendAudioContext.createMediaStreamSource(this.mediaStream);

      // VAD AudioWorklet 로드
      try {
        await this.sendAudioContext.audioWorklet.addModule('vad-audio-processor.js');
      } catch (e) {
        console.warn('[Audio] AudioWorklet 로드 실패, 재시도...');
        await this.sendAudioContext.audioWorklet.addModule('vad-audio-processor.js');
      }

      this.audioWorkletNode = new AudioWorkletNode(
        this.sendAudioContext,
        'vad-audio-processor'
      );

      // VAD 설정 전송
      this.audioWorkletNode.port.postMessage({
        type: 'config',
        vadThreshold: this.vadThreshold,
        noiseGate: this.noiseGate
      });

      // 오디오 데이터 및 통계 수신
      this.audioWorkletNode.port.onmessage = (event) => {
        if (event.data.type === 'stats') {
          this.isVoiceActive = event.data.isActive;
          this.updateEnergyHistory(event.data.energy);
        } else if (event.data.type === 'audio') {
          // 음성이 감지되고 에너지가 충분한 경우에만 전송
          if (this.shouldTransmit()) {
            onAudioData(event.data.buffer);
          }
        }
      };

      // 오디오 노드 연결 (destination은 연결하지 않음 - 에코 방지)
      source.connect(this.audioWorkletNode);

      console.log('[Audio] 마이크 스트리밍 시작 (VAD + 노이즈 게이트 활성화)');
    } catch (error) {
      console.error('[Audio] 마이크 스트리밍 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 에너지 히스토리 업데이트
   */
  private updateEnergyHistory(energy: number): void {
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
  }

  /**
   * 전송 여부 결정 (지능형 필터링)
   */
  private shouldTransmit(): boolean {
    if (!this.isVoiceActive) {
      return false;
    }

    if (this.energyHistory.length === 0) {
      return true;
    }

    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    return avgEnergy > this.noiseGate;
  }

  /**
   * VAD 및 노이즈 게이트 설정 조정
   */
  public setFilterConfig(vadThreshold?: number, noiseGate?: number): void {
    if (vadThreshold !== undefined) {
      this.vadThreshold = vadThreshold;
    }
    if (noiseGate !== undefined) {
      this.noiseGate = noiseGate;
    }

    this.audioWorkletNode?.port.postMessage({
      type: 'config',
      vadThreshold: this.vadThreshold,
      noiseGate: this.noiseGate
    });

    console.log(`[Audio] 필터 설정: VAD=${this.vadThreshold}, Gate=${this.noiseGate}`);
  }

  /**
   * 현재 음성 활동 상태 반환
   */
  public getVoiceStats(): {
    isActive: boolean;
    currentEnergy: number;
    avgEnergy: number;
  } {
    const avgEnergy = this.energyHistory.length > 0
      ? this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length
      : 0;

    return {
      isActive: this.isVoiceActive,
      currentEnergy: this.energyHistory[this.energyHistory.length - 1] || 0,
      avgEnergy
    };
  }

  /**
   * 마이크 스트리밍 중지
   */
  public async stopMicrophoneStreaming(): Promise<void> {
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode.port.close();
      this.audioWorkletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sendAudioContext) {
      await this.sendAudioContext.close();
      this.sendAudioContext = null;
    }

    console.log('[Audio] 마이크 스트리밍 중지');
  }

  /**
   * 서버로부터 받은 오디오 재생 초기화 (수신)
   */
  public initializePlayback(): void {
    if (!this.receiveAudioContext) {
      this.receiveAudioContext = new AudioContext({ sampleRate: 48000 });
      
      // Analyser 초기화
      this.analyser = this.receiveAudioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log('[Audio] 재생 컨텍스트 초기화 완료');
    }
  }

  /**
   * 서버로부터 받은 바이너리 데이터를 재생 큐에 추가
   */
  public handleReceivedAudio(buffer: ArrayBuffer): void {
    if (buffer.byteLength === 0) {
      console.log('[Audio] 수신 스트리밍 종료');
      return;
    }

    const view = new DataView(buffer);
    let pcmData = buffer;

    // WAV 헤더 확인
    if (buffer.byteLength >= 44 && view.getUint32(0, false) === 0x52494646) {
      try {
        const parsedChannels = view.getUint16(22, true);
        const parsedSampleRate = view.getUint32(24, true);

        if (
          parsedChannels > 0 &&
          parsedChannels <= 2 &&
          parsedSampleRate >= 8000 &&
          parsedSampleRate <= 96000
        ) {
          this.currentChannels = parsedChannels;
          this.currentSampleRate = parsedSampleRate;

          pcmData = buffer.slice(44);
          console.log(
            `[Audio] WAV 헤더 감지: ${this.currentChannels}ch, ${this.currentSampleRate}Hz`
          );
        }
      } catch (e) {
        console.warn('[Audio] 헤더 파싱 중 오류 발생. 기존 설정 유지.');
      }
    }

    if (pcmData.byteLength > 0) {
      this.enqueueAudioData(pcmData);
    }
  }

  private enqueueAudioData(buffer: ArrayBuffer): void {
    if (!this.receiveAudioContext) {
      this.initializePlayback();
    }

    const int16Data = new Int16Array(buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    this.audioQueue.push(float32Data);
    this.processAudioQueue();
  }

  private processAudioQueue(): void {
    if (!this.receiveAudioContext) return;

    while (this.audioQueue.length > 0) {
      const float32Data = this.audioQueue.shift();
      if (!float32Data) break;

      this.schedulePlayback(float32Data);
    }
  }

  private schedulePlayback(float32Data: Float32Array): void {
    if (!this.receiveAudioContext) return;

    const currentTime = this.receiveAudioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);

    const channels = this.currentChannels;
    const frameCount = float32Data.length / channels;
    const audioBuffer = this.receiveAudioContext.createBuffer(
      channels,
      frameCount,
      this.currentSampleRate
    );

    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = float32Data[i * channels + channel];
      }
    }

    const source = this.receiveAudioContext.createBufferSource();
    source.buffer = audioBuffer;

    if (this.analyser) {
      source.connect(this.analyser);
      this.analyser.connect(this.receiveAudioContext.destination);
    } else {
      source.connect(this.receiveAudioContext.destination);
    }

    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  public getCurrentRms(): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }

    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }

    const average = sum / this.dataArray.length;
    return (average / 256) * 2.5;
  }

  public async dispose(): Promise<void> {
    console.log('[Audio] 리소스 정리 중...');

    await this.stopMicrophoneStreaming();

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.receiveAudioContext) {
      await this.receiveAudioContext.close();
      this.receiveAudioContext = null;
    }

    this.audioQueue = [];
    this.nextStartTime = 0;

    console.log('[Audio] 리소스 정리 완료');
  }
}