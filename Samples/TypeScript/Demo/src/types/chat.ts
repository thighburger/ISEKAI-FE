/**
 * 채팅 메시지 타입 정의
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: number;
}

/**
 * WebSocket 메시지 타입
 */
export interface WebSocketMessage {
  messageType: 'SUBTITLE' | 'USER_STT' | string;
  content?: {
    text?: string;
  };
}

/**
 * WebSocket 이벤트 핸들러 타입
 */
export interface WebSocketEventHandlers {
  onUserSTT?: (text: string) => void;
  onSubtitle?: (text: string) => void;
}
