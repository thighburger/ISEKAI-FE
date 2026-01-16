import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { ChatMessage } from '@/types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

/**
 * 채팅 메시지 목록을 렌더링하는 React 컴포넌트
 * - messages 배열만 받아서 렌더링 (스트리밍 상태는 각 메시지의 status로 구분)
 */
const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const listRef = useRef<HTMLDivElement>(null);

  // 메시지가 변경되면 자동 스크롤
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <MessageList ref={listRef}>
      {messages.map(message => (
        <MessageBubble 
          key={message.id} 
          type={message.type}
          isStreaming={message.status === 'streaming'}
        >
          {message.text}
        </MessageBubble>
      ))}
    </MessageList>
  );
};

export default ChatMessages;

// --- Styled Components ---

const MessageList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  padding-bottom: 20px;

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const MessageBubble = styled.div<{ type: 'user' | 'ai'; isStreaming?: boolean }>`
  max-width: 80%;
  padding: 12px 20px;
  border-radius: 20px;
  font-size: 1.1rem;
  line-height: 1.5;
  word-break: break-word;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  ${({ type }) =>
    type === 'ai'
      ? `
    align-self: flex-start;
    background-color: rgba(255, 255, 255, 0.95);
    color: #333;
    border-bottom-left-radius: 4px;
  `
      : `
    align-self: flex-end;
    background-color: #7fc8ba;
    color: #fff;
    border-bottom-right-radius: 4px;
  `}

  ${({ isStreaming }) =>
    isStreaming &&
    `
    opacity: 0.8;
    border: 2px dashed rgba(100, 100, 100, 0.3);
  `}
`;
