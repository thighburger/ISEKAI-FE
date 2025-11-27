// src/websocket/websocketmanager.ts
import { LAppDelegate } from '../lappdelegate';
import { AudioStreamManager } from '../websocket/audioStreamManager';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private audioManager: AudioStreamManager;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private nextStartTime: number = 0;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  // 현재 오디오 설정 저장용 (첫 패킷에서 읽은 값 유지)
  private currentChannels: number = 1;
  private currentSampleRate: number = 24000;

  constructor(
    private serverUrl: string,
    audioManager?: AudioStreamManager
  ) {
    // AudioManager를 외부에서 주입받거나, 없으면 내부에서 생성
    this.audioManager = audioManager || new AudioStreamManager();
  }

  /**
   * WebSocket과 오디오 스트리밍 초기화
   */
  public async initialize(): Promise<void> {
    await this.connectWebSocket();
    await this.startAudioStreaming();
  }

  /**
   * WebSocket 연결
   */
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);
        this.ws.binaryType = 'arraybuffer';

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
          if (typeof event.data === 'string') {
            this.handleServerMessage(event.data);
          } else if (event.data instanceof ArrayBuffer) {
            this.handleBinaryMessage(event.data);
          }
        };
      } catch (error) {
        console.error('[WebSocket] 연결 실패:', error);
        reject(error);
      }
    });
  }

  /**
   * 재연결 시도
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 최대 재연결 시도 횟수 초과');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WebSocket] ${this.reconnectDelay / 1000}초 후 재연결 시도... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.initialize().catch((error) => {
        console.error('[WebSocket] 재연결 실패:', error);
      });
    }, this.reconnectDelay);
  }

  /**
   * 오디오 스트리밍 시작 (마이크 -> 서버)
   */
  private async startAudioStreaming(): Promise<void> {
    try {
      // 오디오 재생 컨텍스트 초기화
      this.audioManager.initializePlayback();

      // 마이크 스트리밍 시작
      await this.audioManager.startMicrophoneStreaming((audioData) => {
        this.sendAudioData(audioData);
      });

      console.log('[WebSocket] 오디오 스트리밍 활성화');
    } catch (error) {
      console.error('[WebSocket] 오디오 스트리밍 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 오디오 데이터를 서버로 전송
   */
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

  /**
   * Float32 -> Int16 변환
   */
  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  /**
   * 서버로부터 받은 텍스트 메시지 처리
   */
  private handleServerMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      console.log('[WebSocket] 서버 응답:', message);
      if (message.messageType === "SUBTITLE" && message.content?.text) {
        const subtitleText = message.content.text;
        const appDelegate = LAppDelegate.getInstance()
        // Live2D 매니저를 가져옵니다.
        const live2DManager = appDelegate['_subdelegates'].at(0)?.getLive2DManager();
        if (live2DManager) {
          const modelName = live2DManager.getCurrentModelDisplayName();

          // 자막만 업데이트 (감정 표현 없이)
          live2DManager.showSubtitleMessage(modelName, subtitleText);
        }
      else{
        console.log('[WebSocket] subtitle 객체가 정의되지 않았습니다.');
      }
    }
    } catch (error) {
      console.error('[WebSocket] 메시지 파싱 실패:', error);
    }
  }

  /**
   * 서버로부터 받은 바이너리 메시지 처리 (오디오 데이터)
   */
  private handleBinaryMessage(buffer: ArrayBuffer): void {
    // AudioManager에게 위임
    this.audioManager.handleReceivedAudio(buffer);
  }

  /**
   * WebSocket 연결 상태 확인
   */
  public getIsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 현재 재생 중인 오디오의 RMS 값 반환
   */
  public getCurrentRms(): number {
    return this.audioManager.getCurrentRms();
  }

  /**
   * 모든 리소스 정리
   */
  public async dispose(): Promise<void> {
    console.log('[WebSocket] 리소스 정리 중...');

    // 오디오 매니저 정리
    await this.audioManager.dispose();

    // WebSocket 정리
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log('[WebSocket] 리소스 정리 완료');
  }

  /**
   * AudioManager 인스턴스 반환 (필요시)
   */
  public getAudioManager(): AudioStreamManager {
    return this.audioManager;
  }
}