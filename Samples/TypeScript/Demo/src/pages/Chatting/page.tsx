import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import Live2DViewer from '@/components/Live2DViewer';
import { useWebSocket } from '@/hooks/useWebSocket';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import OverlayButton from '@/components/OverlayButton';
import OverlayContainer from '@/components/OverlayContainer';
import { FONTS } from '@/constants';
import { ChatMessage } from '@/types/chat';
import { Character } from '@/types/character';

const ChattingPage = () => {
  const wsUrl = import.meta.env.VITE_WS_SERVER_URL;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Character 정보 가져오기
  const character = location.state?.character as Character | undefined;

  // Character 정보가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!character) {
      console.warn('캐릭터 정보가 없습니다. 홈으로 이동합니다.');
      navigate('/');
    }
  }, [character, navigate]);

  // React 상태로 채팅 메시지 관리
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStarted, setIsStarted] = useState(true);
  
  // 줌 레벨 상태 (1.0 = 기본, 1.5 = 150% 확대, 2.0 = 200% 확대)
  const [zoomLevel, setZoomLevel] = useState(1.0);

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
  }, [addMessage]);

  const handleSubtitle = useCallback((text: string) => {
    addMessage('ai', text);
  }, [addMessage]);

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

  // 줌 인/아웃 핸들러
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1.0));
  }, []);

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

  // Character가 없으면 빈 화면 반환 (리다이렉트 중)
  if (!character) {
    return null;
  }

  return (
    <PageContainer>
      {/* 1. 배경 이미지 - Character의 backgroundUrl 사용 */}
      <Background $backgroundUrl={character.backgroundUrl} />

      {/* 2. 뒤로가기 버튼 */}
      <BackButtonWrapper>
        <OverlayButton onClick={() => navigate(-1)} size="md">
          <img src="/Resources/arrow-back.png" alt="뒤로가기" />
        </OverlayButton>
      </BackButtonWrapper>

      {/* 3. 줌 컨트롤 버튼 */}
      <ZoomControlsWrapper>
        <OverlayContainer padding="md">
          <OverlayButton onClick={handleZoomIn} size="sm">+</OverlayButton>
          <ZoomLevel>{Math.round(zoomLevel * 100)}%</ZoomLevel>
          <OverlayButton onClick={handleZoomOut} size="sm" disabled={zoomLevel <= 1.0}>−</OverlayButton>
        </OverlayContainer>
      </ZoomControlsWrapper>

      {/* 4. Live2D 컨테이너 (좌측 50%) - Character의 live2dModelUrl 사용 */}
      <Live2DContainer>
        <Live2DWrapper>
          <Live2DViewer 
            modelUrl={character.live2dModelUrl}
            getLipSyncValue={getCurrentRms} 
            zoom={zoomLevel}
          />
        </Live2DWrapper>
      </Live2DContainer>

      {/* 5. 채팅 UI (우측 50%) - React 컴포넌트 사용 */}
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

const Background = styled.div<{ $backgroundUrl?: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$backgroundUrl || '/Resources/anime-school-background.jpg'});
  background-size: cover;
  background-position: center;
  filter: blur(3px) brightness(1);
  transform: scale(1.1);
  z-index: 1;
`;

const BackButtonWrapper = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
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

const ZoomControlsWrapper = styled.div`
  position: absolute;
  top: 80px;
  left: 20px;
  z-index: 10;
`;

const ZoomLevel = styled.span`
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;