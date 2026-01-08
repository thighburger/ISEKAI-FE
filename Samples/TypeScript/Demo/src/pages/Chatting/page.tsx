import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import Live2DViewer from '@/components/Live2DViewer';
import { useWebSocket } from '@/hooks/useWebSocket';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import { FONTS } from '@/constants';
import { ChatMessage } from '@/types/chat';

const ChattingPage = () => {
  const wsUrl = import.meta.env.VITE_WS_SERVER_URL;
  const navigate = useNavigate();

  // React 상태로 채팅 메시지 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStarted, setIsStarted] = useState(true);

  // 메시지 추가 헬퍼 함수
  const addMessage = useCallback((type: 'user' | 'ai', text: string) => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  // WebSocket 이벤트 핸들러
  const handleUserSTT = useCallback((text: string) => {
    addMessage('user', text);
  }, []);

  const handleSubtitle = useCallback((text: string) => {
    addMessage('ai', text);
  }, []);

  // WebSocket 연결 및 오디오 스트리밍
  const { getCurrentRms } = useWebSocket({
    serverUrl: isStarted ? wsUrl : '',
    autoConnect: isStarted,
    onUserSTT: handleUserSTT,
    onSubtitle: handleSubtitle
  });

  // 사용자 입력 처리
  const handleSendMessage = useCallback(
    (text: string) => {
      //추후 구현
    },
    [addMessage]
  );

  // 마이크 권한 체크
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const status = await navigator.permissions.query({
            name: 'microphone' as PermissionName
          });
          if (status.state === 'granted') setIsStarted(true);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    checkPermission();
  }, []);

  return (
    <PageContainer>
      {/* 1. 배경 이미지 */}
      <Background />

      {/* 2. 뒤로가기 버튼 */}
      <BackButton onClick={() => navigate(-1)}>
        <img src="/Resources/arrow-back.png" alt="뒤로가기" />
      </BackButton>

      {/* 3. Live2D 컨테이너 (좌측 50%) */}
      <Live2DContainer>
        <Live2DWrapper>
          <Live2DViewer modelUrl="/Resources/ANIYA.zip" getLipSyncValue={getCurrentRms} />
        </Live2DWrapper>
      </Live2DContainer>

      {/* 4. 채팅 UI (우측 50%) - React 컴포넌트 사용 */}
      <ChatUIWrapper>
        <ChatMessages messages={messages} />
        <ChatInput
          onSend={handleSendMessage}
          placeholder="감정 키워드를 입력하세요 (예: 슬픔, 웃음)"
        />
      </ChatUIWrapper>
    </PageContainer>
  );
};

export default ChattingPage;

// --- Styled Components ---

const PageContainer = styled.section`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: ${FONTS.family.netmarble.medium}, sans-serif;
  background-color: #000;
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/Resources/anime-school-background.jpg');
  background-size: cover;
  background-position: center;
  filter: blur(3px) brightness(1);
  transform: scale(1.1);
  z-index: 1;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  padding: 10px;
  display: flex;
  img {
    width: 24px;
    height: 24px;
  }
`;

const Live2DContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Live2DWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const ChatUIWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  padding: 40px 80px;
  box-sizing: border-box;
`;
