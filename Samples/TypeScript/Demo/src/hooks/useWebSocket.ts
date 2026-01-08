import { useEffect, useRef, useState, useCallback } from 'react';
import { useMicrophone } from './audio/useMicrophone';
import { useAudioPlayback } from './audio/useAudioPlayback';
import { float32ToInt16 } from './audio/audioUtils';
import { WebSocketEventHandlers, WebSocketMessage } from '@/types/chat';

interface UseWebSocketOptions extends WebSocketEventHandlers {
  serverUrl: string;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isMicActive: boolean;
  isVoiceDetected: boolean;
  error: Error | null;
  getCurrentRms: () => number;
}

/**
 * WebSocket 연결 및 오디오 스트리밍을 관리하는 통합 훅
 * 클래스 없이 훅 조합으로 구현
 */
export const useWebSocket = ({
  serverUrl,
  autoConnect = true,
  onUserSTT,
  onSubtitle
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // 이벤트 핸들러 refs (최신 값 유지)
  const handlersRef = useRef({
    onUserSTT,
    onSubtitle
  });
  useEffect(() => {
    handlersRef.current = { onUserSTT, onSubtitle };
  }, [onUserSTT, onSubtitle]);

  // 오디오 재생 훅
  const { playAudio, getCurrentRms } = useAudioPlayback();

  // 마이크 데이터 전송 콜백
  const handleAudioData = useCallback((data: Float32Array) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    try {
      const int16Data = float32ToInt16(data);
      ws.send(int16Data.buffer);
    } catch (err) {
      console.error('[WebSocket] 오디오 전송 실패:', err);
    }
  }, []);

  // 마이크 훅
  const {
    isActive: isMicActive,
    isVoiceDetected,
    start: startMic,
    stop: stopMic
  } = useMicrophone({
    onAudioData: handleAudioData
  });

  // WebSocket 메시지 처리
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] 텍스트 메시지 수신:', message);

          if (message.messageType === 'SUBTITLE' && message.content?.text) {
            handlersRef.current.onSubtitle?.(message.content.text);
          } else if (message.messageType === 'USER_STT' && message.content?.text) {
            handlersRef.current.onUserSTT?.(message.content.text);
          }
        } catch (err) {
          console.error('[WebSocket] 메시지 파싱 실패:', err);
        }
      } else if (event.data instanceof ArrayBuffer) {
        console.log('[WebSocket] 오디오 데이터 수신:', event.data.byteLength, 'bytes');
        playAudio(event.data);
      } else {
        console.warn('[WebSocket] 알 수 없는 데이터 타입:', typeof event.data);
      }
    },
    [playAudio]
  );

  // 재연결 시도
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= 5) {
      console.error('[WebSocket] 최대 재연결 시도 횟수 초과');
      return;
    }

    reconnectAttemptsRef.current++;
    console.log(`[WebSocket] 3초 후 재연결... (${reconnectAttemptsRef.current}/5)`);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      connect();
    }, 3000);
  }, []);

  // WebSocket 연결
  const connect = useCallback(async () => {
    if (!serverUrl) return;

    try {
      console.log('[WebSocket] 연결 시도...');

      const ws = new WebSocket(serverUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('[WebSocket] 연결 성공');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // 마이크 시작
        try {
          await startMic();
        } catch (err) {
          console.error('[WebSocket] 마이크 시작 실패:', err);
        }
      };

      ws.onerror = event => {
        console.error('[WebSocket] 에러:', event);
        const err = new Error('WebSocket error');
        setError(err);
      };

      ws.onclose = () => {
        console.log('[WebSocket] 연결 종료');
        setIsConnected(false);
        stopMic();
        attemptReconnect();
      };

      ws.onmessage = handleMessage;
    } catch (err) {
      console.error('[WebSocket] 연결 실패:', err);
      setError(err instanceof Error ? err : new Error('Connection failed'));
    }
  }, [serverUrl, startMic, stopMic, handleMessage, attemptReconnect]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopMic();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [stopMic]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect && serverUrl) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [serverUrl]); // connect, disconnect를 의존성에서 제외하여 무한루프 방지

  return {
    isConnected,
    isMicActive,
    isVoiceDetected,
    error,
    getCurrentRms
  };
};
