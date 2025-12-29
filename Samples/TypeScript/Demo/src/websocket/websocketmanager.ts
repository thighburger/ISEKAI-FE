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

      // 1. AI의 답변 자막 처리
      if (message.messageType === "SUBTITLE" && message.content?.text) {
        const subtitleText = message.content.text;
        const live2DManager = LAppDelegate.getInstance().getLive2DManager();
        if (live2DManager) {
          const modelName = live2DManager.getCurrentModelDisplayName();
          live2DManager.showSubtitleMessage(modelName, subtitleText); // AI 말풍선 추가
        }
      } 
      
      // 2. 추가: 내가 말한 음성 인식 결과(STT) 처리
      // 서버에서 보내주는 메시지 구조에 맞춰 messageType을 확인합니다.
      else if (message.messageType === "USER_STT" && message.content?.text) {
        const userText = message.content.text;
        const appDelegate = LAppDelegate.getInstance();
        
        // 에러가 나던 줄을 삭제하고 아래와 같이 수정합니다.
        const view = appDelegate.getView(); // 1단계에서 만든 메서드 사용
        
        if (view) {
          // LAppView에서 ChatManager를 가져와 사용자 메시지를 추가합니다.
          view.getChatManager().addUserMessage(userText); 
        } else {
          console.warn('[WebSocket] View를 찾을 수 없어 사용자 메시지를 표시하지 못했습니다.');
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