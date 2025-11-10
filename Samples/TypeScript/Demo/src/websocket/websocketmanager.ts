export class WebSocketManager {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private isInitializing: boolean = false; // 중복 초기화 방지

  private bytesSent: number = 0;
  private messageCount: number = 0;
  private lastLogTime: number = Date.now();
  private totalMessageCount: number = 0; // 전체 누적 카운트

  constructor(private serverUrl: string) {}
  
  public async initialize(): Promise<void> {
    // 이미 초기화 중이면 중단
    if (this.isInitializing) {
      console.log('[WebSocket] 이미 초기화 중입니다. 중복 호출 방지.');
      return;
    }

    // 이미 연결되어 있으면 중단
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] 이미 연결되어 있습니다.');
      return;
    }

    this.isInitializing = true;

    try {
      await this.connectWebSocket();
      await this.startAudioStreaming();
      this.startStatsLogging();
    } finally {
      this.isInitializing = false;
    }
  }

  private startStatsLogging(): void {
    // 이미 로깅 중이면 중복 방지
    if ((this as any)._statsInterval) {
      return;
    }

    (this as any)._statsInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - this.lastLogTime) / 1000 || 1;
      const kbPerSec = (this.bytesSent / 1024 / elapsed).toFixed(2);
      
      console.log(`[Stats] 최근 5초: ${this.messageCount}개 메시지, ${kbPerSec} KB/s | 총 누적: ${this.totalMessageCount}개, ${(this.bytesSent / 1024).toFixed(2)} KB`);
      
      // 주기적 통계만 리셋 (전체 카운트는 유지)
      this.bytesSent = 0;
      this.messageCount = 0;
      this.lastLogTime = now;
    }, 5000);
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 기존 WebSocket이 있으면 정리
        if (this.ws) {
          console.log('[WebSocket] 기존 연결 정리 중...');
          this.ws.onclose = null; // 재연결 방지
          this.ws.close();
          this.ws = null;
        }

        console.log(`[WebSocket] 새 연결 생성: ${this.serverUrl}`);
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

        this.ws.onclose = (event) => {
          console.log(`[WebSocket] 연결 종료 (코드: ${event.code}, 사유: ${event.reason || '없음'})`);
          this.isConnected = false;
          
          // 정상 종료가 아닌 경우에만 재연결 시도
          if (event.code !== 1000) {
            this.attemptReconnect();
          }
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

    // 이미 재연결 중이면 중단
    if (this.isInitializing) {
      console.log('[WebSocket] 이미 재연결 중입니다.');
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
      // 이미 오디오 스트리밍 중이면 스킵
      if (this.audioContext && this.mediaStream) {
        console.log('[Audio] 이미 오디오 스트리밍 중입니다.');
        return;
      }

      console.log('[Audio] 마이크 접근 요청...');

      // 마이크 권한 요청 - Linear PCM 16kHz mono
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,  // 16kHz sampling rate
          channelCount: 1,     // Mono (단일 채널)
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[Audio] 마이크 접근 허용됨');
      console.log('[Audio] 설정: 16kHz, Mono, Linear PCM (Int16)');

      // AudioContext 생성 - 16kHz sampling rate
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      console.log(`[Audio] AudioContext 생성됨 (샘플레이트: ${this.audioContext.sampleRate}Hz)`);
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // AudioWorklet 로드 및 생성
      console.log('[Audio] AudioWorklet 로드 중...');
      await this.audioContext.audioWorklet.addModule('audio-processor.js');
      
      this.audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        'audio-processor'
      );

      console.log('[Audio] AudioWorkletNode 생성됨');

      // 오디오 데이터 수신 및 전송
      this.audioWorkletNode.port.onmessage = (event) => {
        const audioData: Float32Array = event.data;
        
        // 디버깅: 실제 오디오 데이터가 있는지 확인 (처음 5개만)
        const hasData = audioData.some(sample => Math.abs(sample) > 0.001);
        if (!hasData && this.totalMessageCount < 5) {
          console.warn('[Audio] 빈 오디오 데이터 감지 (모든 샘플이 거의 0)');
        }
        
        this.sendAudioData(audioData);
      };

      // 오디오 노드 연결
      source.connect(this.audioWorkletNode);
      // destination 연결 제거 (스피커 출력 방지)
      // this.audioWorkletNode.connect(this.audioContext.destination);

      console.log('[Audio] 실시간 스트리밍 시작');
      console.log('[Audio] 포맷: Linear PCM, 16-bit signed integer, 16kHz, Mono');
    } catch (error) {
      console.error('[Audio] 스트리밍 시작 실패:', error);
      throw error;
    }
  }

  private sendAudioData(audioData: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (this.totalMessageCount < 5) {
        console.warn('[WebSocket] 연결되지 않음, 데이터 전송 불가');
      }
      return;
    }

    if (audioData.length === 0) {
      console.warn('[WebSocket] 빈 오디오 데이터, 전송 스킵');
      return;
    }

    try {
      // Float32 → Int16 변환 (Linear PCM)
      const int16Data = this.float32ToInt16(audioData);
      const byteLength = int16Data.buffer.byteLength;
      
      // WebSocket으로 전송
      this.ws.send(int16Data.buffer);
      
      // 통계 업데이트 (주기적 + 전체)
      this.bytesSent += byteLength;
      this.messageCount++;
      this.totalMessageCount++;
      
      // 첫 전송 로그 (전체 카운트 기준)
      if (this.totalMessageCount === 1) {
        console.log(`[WebSocket] 첫 오디오 데이터 전송 성공! (${byteLength} bytes)`);
        console.log(`[WebSocket] 연결 상태: readyState=${this.ws.readyState}, bufferedAmount=${this.ws.bufferedAmount}`);
      }
    } catch (error) {
      console.error('[WebSocket] 오디오 전송 실패:', error);
    }
  }

  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // -1.0 ~ 1.0 범위를 -32768 ~ 32767로 변환 (Linear PCM 16-bit)
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

    // 통계 로깅 중단
    if ((this as any)._statsInterval) {
      clearInterval((this as any)._statsInterval);
      (this as any)._statsInterval = null;
    }

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
      this.ws.onclose = null;
      this.ws.close(1000, 'Client initiated close');
      this.ws = null;
    }

    this.isConnected = false;
    this.isInitializing = false;
    this.totalMessageCount = 0;
    console.log('[WebSocket] 리소스 정리 완료');
  }
}