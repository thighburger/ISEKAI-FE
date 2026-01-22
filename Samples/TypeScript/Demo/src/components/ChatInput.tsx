import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import styled from '@emotion/styled';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 채팅 입력 컴포넌트
 */
const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  placeholder = '메시지를 입력하세요...',
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 입력 내용에 따라 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      // 높이를 초기화하여 줄어든 경우도 반영
      textareaRef.current.style.height = '52px';
      const scrollHeight = textareaRef.current.scrollHeight;
      
      // 최대 높이 제한 (예: 150px)
      if (scrollHeight > 52) {
        textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
      }
    }
  }, [inputValue]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // IME 조합 중(한글 입력 등)이면 무시 - 마지막 글자 중복 방지
    if (e.nativeEvent.isComposing) return;
    
    // Shift + Enter는 줄바꿈 허용, 그냥 Enter는 전송
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() !== '' && !disabled) {
        onSend(inputValue.trim());
        setInputValue('');
      }
    }
  };

  return (
    <InputWrapper>
      <StyledTextarea
        ref={textareaRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />
    </InputWrapper>
  );
};

export default ChatInput;

// --- Styled Components ---

const InputWrapper = styled.div`
  flex: 1;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  height: 52px; /* 기본 높이 */
  min-height: 52px;
  max-height: 150px; /* 최대 높이 */
  padding: 14px 24px; /* 텍스트 수직 중앙 정렬 조정 */
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 16px;
  outline: none;
  backdrop-filter: blur(10px);
  box-sizing: border-box;
  resize: none; /* 사용자 임의 조절 방지 */
  line-height: 1.5;
  overflow-y: auto; /* 내용이 넘치면 스크롤 */

  /* 스크롤바 커스터마이징 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;
