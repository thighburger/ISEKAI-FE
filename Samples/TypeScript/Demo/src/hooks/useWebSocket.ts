import { useEffect, useRef, useState, useCallback } from 'react';
import { useMicrophone } from './audio/useMicrophone';
import { useAudioPlayback } from './audio/useAudioPlayback';
import { float32ToInt16 } from './audio/audioUtils';
import { WebSocketEventHandlers, WebSocketMessage, EmotionType } from '@/types/chat';

interface UseWebSocketOptions extends WebSocketEventHandlers {
  serverUrl: string;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isServerReady: boolean;
  isMicActive: boolean;
  error: Error | null;
  getCurrentRms: () => number;
  sendTextMessage: (text: string) => void;
  toggleMic: () => Promise<void>;
}

/**
 * WebSocket 연결 및 오디오 스트리밍을 관리하는 통합 훅
 * API 명세서 기반 메시지 처리 구현
 */
export const useWebSocket = ({
  serverUrl,
  autoConnect = true,
  onServerReady,
  onUserSubtitleChunk,
  onUserSentence,
  onTurnComplete,
  onEmotion,
  onInterrupted,
  onError
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // 이벤트 핸들러 refs (최신 값 유지)
  const handlersRef = useRef({
    onServerReady,
    onUserSubtitleChunk,
    onUserSentence,
    onTurnComplete,
    onEmotion,
    onInterrupted,
    onError
  });
  useEffect(() => {
    handlersRef.current = {
      onServerReady,
      onUserSubtitleChunk,
      onUserSentence,
      onTurnComplete,
      onEmotion,
      onInterrupted,
      onError
    };
  }, [onServerReady, onUserSubtitleChunk, onUserSentence, onTurnComplete, onEmotion, onInterrupted, onError]);

  // 오디오 재생 훅
  const { playAudio , getCurrentRms } = useAudioPlayback();

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
    start: startMic,
    stop: stopMic
  } = useMicrophone({
    onAudioData: handleAudioData
  });

  // 텍스트 메시지 전송
  const sendTextMessage = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] 연결되지 않아 메시지를 보낼 수 없습니다.');
      return;
    }

    const message = {
      messageType: 'TEXT_MESSAGE',
      content: {
        '@type': 'textMessage',
        text: text
      }
    };

    try {
      ws.send(JSON.stringify(message));
      console.log('[WebSocket] 텍스트 메시지 전송:', text, message);
    } catch (err) {
      console.error('[WebSocket] 텍스트 메시지 전송 실패:', err);
    }
  }, []);

  // WebSocket 메시지 처리
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // 바이너리 데이터 (PCM 오디오)
      if (event.data instanceof ArrayBuffer) {
        console.log('[WebSocket] 오디오 데이터 수신:', event.data.byteLength, 'bytes');
        playAudio(event.data);
        return;
      }

      // 텍스트 메시지
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('[WebSocket] 텍스트 메시지 수신:', message.messageType, message);

          switch (message.messageType) {
            case 'SERVER_READY':
              console.log('[WebSocket] 서버 준비 완료');
              setIsServerReady(true);
              handlersRef.current.onServerReady?.();
              break;

            case 'USER_SUBTITLE_CHUNK':
              handlersRef.current.onUserSubtitleChunk?.(message.content.text);
              break;

            case 'USER_SUBTITLE_COMPLETE':
              handlersRef.current.onUserSentence?.(message.content.text);
              break;

            case 'TURN_COMPLETE':
              handlersRef.current.onTurnComplete?.(
                message.content.user,
                message.content.bot
              );
              break;

            case 'EMOTION':
              handlersRef.current.onEmotion?.(message.content.emotion);
              break;

            case 'INTERRUPTED':
              console.log('[WebSocket] 사용자 끼어들기 감지');
              handlersRef.current.onInterrupted?.();
              break;

            case 'ERROR':
              console.error('[WebSocket] 서버 에러:', message.content.errorCode, message.content.message);
              handlersRef.current.onError?.(
                message.content.errorCode,
                message.content.message
              );
              break;

            default:
              console.warn('[WebSocket] 알 수 없는 메시지 타입:', (message as { messageType: string }).messageType);
          }
        } catch (err) {
          console.error('[WebSocket] 메시지 파싱 실패:', err);
        }
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
        // 마이크는 수동으로 시작 (버튼 클릭 시)
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

  // 마이크 토글 (켜기/끄기)
  const toggleMic = useCallback(async () => {
    if (isMicActive) {
      stopMic();
      console.log('[WebSocket] 마이크 중지');
    } else {
      try {
        await startMic();
        console.log('[WebSocket] 마이크 시작');
      } catch (err) {
        console.error('[WebSocket] 마이크 시작 실패:', err);
      }
    }
  }, [isMicActive, startMic, stopMic]);

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
    isServerReady,
    isMicActive,
    error,
    getCurrentRms,
    sendTextMessage,
    toggleMic
  };
};
