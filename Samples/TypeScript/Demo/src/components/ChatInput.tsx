import React, { useState, KeyboardEvent } from 'react';
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '' && !disabled) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <InputWrapper>
      <StyledInput
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
    </InputWrapper>
  );
};

export default ChatInput;

// --- Styled Components ---

const InputWrapper = styled.div`
  width: 100%;
  margin-top: 20px;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 16px 24px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 16px;
  outline: none;
  backdrop-filter: blur(10px);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;
