export class WebSocketManager {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  constructor(private serverUrl: string) {}
  public async initialize(): Promise<void> {
    await this.connectWebSocket();
    await this.startAudioStreaming();
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('[WebSocket] 연결 성공');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] 에러:', error);
          this.isConnected = false;
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] 연결 종료');
          this.isConnected = false;
          this.attemptReconnect();
        };

        this.ws.onmessage = (event) => {
          console.log('[WebSocket] 서버 응답:', event.data);
          this.handleServerMessage(event.data);
        };
      } catch (error) {
        console.error('[WebSocket] 연결 실패:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 최대 재연결 시도 횟수 초과');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] ${this.reconnectDelay / 1000}초 후 재연결 시도... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.initialize().catch((error) => {
        console.error('[WebSocket] 재연결 실패:', error);
      });
    }, this.reconnectDelay);
  }

  private async startAudioStreaming(): Promise<void> {
    try {
      console.log('[Audio] 마이크 접근 요청...');

      // 마이크 권한 요청
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[Audio] 마이크 접근 허용됨');

      // AudioContext 생성
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // AudioWorklet 로드 및 생성
      await this.audioContext.audioWorklet.addModule('audio-processor.js');
      this.audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        'audio-processor'
      );

      // 오디오 데이터 수신 및 전송
      this.audioWorkletNode.port.onmessage = (event) => {
        const audioData: Float32Array = event.data;
        this.sendAudioData(audioData);
      };

      // 오디오 노드 연결
      source.connect(this.audioWorkletNode);
      this.audioWorkletNode.connect(this.audioContext.destination);

      console.log('[Audio] 실시간 스트리밍 시작');
    } catch (error) {
      console.error('[Audio] 스트리밍 시작 실패:', error);
      throw error;
    }
  }

  private sendAudioData(audioData: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const int16Data = this.float32ToInt16(audioData);
      this.ws.send(int16Data.buffer);
    } catch (error) {
      console.error('[WebSocket] 오디오 전송 실패:', error);
    }
  }

  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  private handleServerMessage(data: any): void {
    try {
      // JSON 파싱 시도
      const message = JSON.parse(data);
      console.log('[WebSocket] 파싱된 메시지:', message);
      
    } catch (error) {
      // JSON이 아닌 경우 그대로 처리
      console.log('[WebSocket] 원본 메시지:', data);
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  public dispose(): void {
    console.log('[WebSocket] 리소스 정리 중...');

    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode.port.close();
      this.audioWorkletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log('[WebSocket] 리소스 정리 완료');
  }
}