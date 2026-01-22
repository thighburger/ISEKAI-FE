import React, { useState, useCallback, useEffect } from 'react';
import { BsFillMicFill, BsMicMuteFill } from 'react-icons/bs';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import Live2DViewer from '@/components/Live2DViewer';
import { useWebSocket } from '@/hooks/useWebSocket';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import OverlayButton from '@/components/OverlayButton';
import OverlayContainer from '@/components/OverlayContainer';
import LoadingCircle from '@/components/LoadingComponent/LoadingCircle';
import { FONTS, COLORS } from '@/constants';
import { EmotionType } from '@/types/chat';
import { Character } from '@/types/character';
import { getTicketForWebSocket } from './api/getTicketForWebSocket';
import { useChatMessages } from './hooks/useChatMessages';

// 웹소켓 감정 타입 → Live2D 감정 이름 매핑
const EMOTION_MAP: Record<EmotionType, string> = {
  SAD: '슬픔',
  SHY: '부끄러움',
  HAPPY: '행복',
  ANGRY: '화남',
  NEUTRAL: '중립',
  SURPRISED: '놀람',
  DESPISE: '경멸'
};

// 기본 리소스 URL
const DEFAULT_BACKGROUND = '/Resources/anime-school-background.jpg';
const DEFAULT_LIVE2D_MODEL = '/Resources/live2d_model.zip';

interface LocationState {
  character?: Character;
}

const ChattingPage = () => {
  const wsBaseUrl = import.meta.env.VITE_WS_SERVER_URL;
  const navigate = useNavigate();
  const location = useLocation();
  
  // Home 페이지에서 전달받은 캐릭터 정보
  const { character } = (location.state as LocationState) || {};
  const characterId = character?.id?.toString();
  const characterName = character?.name || '캐릭터';
  const backgroundUrl = character?.backgroundUrl || DEFAULT_BACKGROUND;
  const live2dModelUrl = character?.live2dModelUrl || DEFAULT_LIVE2D_MODEL;

  // 채팅 메시지 관리 (커스텀 훅으로 분리)
  const { messages, isBotResponding, isBotThinking, currentEmotion, addUserTextMessage, loadChatHistory, handlers } = useChatMessages();

  // UI 상태
  const [zoomLevel, setZoomLevel] = useState(2.5);

  // 1. WS 티켓 발급 (React Query 사용)
  const { data: ticket, isLoading: isTicketLoading } = useQuery({
    queryKey: ['ws-ticket', characterId],
    queryFn: getTicketForWebSocket,
    staleTime: 0, // 매번 재요청 (티켓 재사용 방지)
    gcTime: 0, // 캐시 저장 안 함 (v5 기준)
    refetchOnWindowFocus: false, // 포커스 시 재요청 금지 (채팅 중 끊김 방지)
  });

  // 채팅 내역 불러오기
  useEffect(() => {
      loadChatHistory(characterId);
  }, [characterId]);

  // 2. URL 구성 (티켓과 characterId가 있을 때만 생성)
  const fullWsUrl = (characterId && ticket && wsBaseUrl) 
    ? `${wsBaseUrl}/characters/${characterId}/voice?ticket=${ticket}`
    : '';

  // WebSocket 연결 및 오디오 스트리밍
  const { 
    getCurrentRms, 
    isServerReady, 
    isConnected,
    isMicActive,
    isAudioPlaying,
    isUserSpeaking,
    sendTextMessage,
    toggleMic
  } = useWebSocket({
    serverUrl: fullWsUrl,
    autoConnect: true,
    ...handlers
  });

  // 오디오 재생 상태, 사용자 발화 상태, 감정에 따른 모션 결정
  // 우선순위: 캐릭터 말하기 > 사용자 말하기(듣기) > 대기
  const currentMotion = React.useMemo(() => {
    // 1. 캐릭터가 말할 때 (오디오 재생 중)
    if (isAudioPlaying) {
      console.log('말하기 모션 재생');
      return Math.random() < 0.5 ? '말하기1' : '말하기2';
    }
    // 2. 사용자가 말할 때 (마이크 입력 감지)
    if (isUserSpeaking) {
      console.log('듣기 모션 재생');
      return '듣기';
    }

    // 4. BOT_IS_THINKING 이후부터 말하기 전까지 생각하는 모션 중립, 행복, 놀람 시 에만
    if (isBotThinking && (currentEmotion === 'NEUTRAL' || currentEmotion === 'HAPPY' || currentEmotion === 'SURPRISED')) {
      console.log('생각 모션 재생');
      return '생각';
    }

    // 3. 대기 상태: 감정에 따라 결정
    if (currentEmotion === 'SHY' || currentEmotion === 'DESPISE') {
      console.log('대기3 모션 재생');
      return '대기3'; // 정적인 동작 (부끄러움, 경멸)
    }

    // 그 외에는 대기1, 대기2 랜덤
    return Math.random() < 0.5 ? '대기1' : '대기2';
  }, [isAudioPlaying, isUserSpeaking, isBotThinking, currentEmotion]);

  // 사용자 텍스트 입력 처리
  const handleSendMessage = useCallback(
    (text: string) => {
      // 사용자 메시지를 채팅에 추가 (TEXT_MESSAGE는 USER_SUBTITLE이 안 오므로 직접 추가)
      addUserTextMessage(text);
      
      // WebSocket으로 텍스트 메시지 전송
      sendTextMessage(text);
    },
    [sendTextMessage, addUserTextMessage]
  );

  // 줌 인/아웃 핸들러
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1.0));
  }, []);

  // 캐릭터 정보가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!character) {
      console.warn('[ChattingPage] 캐릭터 정보가 없습니다. 홈으로 이동합니다.');
      navigate('/', { replace: true });
    }
  }, [character, navigate]);

  // 캐릭터 정보가 없으면 렌더링하지 않음
  if (!character) {
    return null;
  }

  // 로딩 상태 판단 (티켓 발급 중 또는 서버 연결 중)
  const isLoading = isTicketLoading || !isServerReady;

  // 로딩 메시지 계산
  const getLoadingMessage = () => {
    if (isTicketLoading) return '서버에 연결하는 중...';
    if (!isConnected) return '웹소켓 연결 중...';
    if (!isServerReady) return `${characterName}를 불러오는 중...`;
    return '준비 완료!';
  };

  return (
    <PageContainer>
      {/* 0. 전체 화면 로딩 오버레이 */}
      {isLoading && (
        <FullScreenLoading>
          <LoadingCircle
            characterImage={character?.thumbnailUrl || '/Resources/live2d-photo.png'}
            loadingText={getLoadingMessage()}
            size={220}
          />
          <LoadingSubText>
            잠시만 기다려주세요
          </LoadingSubText>
        </FullScreenLoading>
      )}

      {/* 1. 배경 이미지 (캐릭터별 동적 적용) */}
      <Background backgroundUrl={backgroundUrl} />

      {/* 2. 뒤로가기 버튼 */}
      <BackButtonWrapper>
        <OverlayButton onClick={() => navigate(-1)} size="md">
          <img src="/Resources/arrow-back.png" alt="뒤로가기" />
        </OverlayButton>
      </BackButtonWrapper>


      {/* 4. 줌 컨트롤 버튼 */}
      <ZoomControlsWrapper>
        <OverlayContainer padding="md">
          <OverlayButton onClick={handleZoomIn} size="sm">+</OverlayButton>
          <ZoomLevel>{Math.round(zoomLevel * 100)}%</ZoomLevel>
          <OverlayButton onClick={handleZoomOut} size="sm" disabled={zoomLevel <= 1.0}>−</OverlayButton>
        </OverlayContainer>
      </ZoomControlsWrapper>

      {/* 5. Live2D 컨테이너 (좌측 50%) */}
      <Live2DContainer>
        <Live2DWrapper>
          <Live2DViewer 
            modelUrl={live2dModelUrl} 
            getLipSyncValue={getCurrentRms} 
            zoom={zoomLevel}
            expression={EMOTION_MAP[currentEmotion]}
            motion={currentMotion}
          />
        </Live2DWrapper>
        
        {/* 봇 응답 중 표시 */}
        {isBotResponding && (
          <BotTypingIndicator>
            <TypingDots>
              <span></span>
              <span></span>
              <span></span>
            </TypingDots>
            <TypingText>응답 중...</TypingText>
          </BotTypingIndicator>
        )}
      </Live2DContainer>

      {/* 6. 채팅 UI (우측 50%) - React 컴포넌트 사용 */}
      <ChatUIWrapper>
        {/* 로딩 상태 */}
        {isTicketLoading && (
          <LoadingOverlay>
            <LoadingSpinner />
            <LoadingText>연결 준비 중...</LoadingText>
          </LoadingOverlay>
        )}
        
        <ChatMessages messages={messages} />
        <ChatInputWrapper>
          <ChatInput
            onSend={handleSendMessage}
            placeholder={
              !isServerReady 
                ? '서버에 연결 중...' 
                : isBotResponding 
                  ? '응답을 기다리는 중...' 
                  : '메시지를 입력하세요'
            }
            disabled={!isServerReady || isBotResponding}
          />
          <MicButton 
            onClick={toggleMic} 
            active={isMicActive}
            disabled={!isServerReady}
          >
            {isMicActive ? <BsFillMicFill size={22} /> : <BsMicMuteFill size={22} />}
          </MicButton>
        </ChatInputWrapper>
      </ChatUIWrapper>
    </PageContainer>
  );
};

export default ChattingPage;

// --- Keyframes ---

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

const PageContainer = styled.section`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: ${FONTS.family.netmarble.medium}, sans-serif;
  background-color: #000;
`;

const FullScreenLoading = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${COLORS.background.primary};
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const LoadingSubText = styled.p`
  margin-top: 16px;
  font-size: 0.9rem;
  color: ${COLORS.text.secondary};
  letter-spacing: 1px;
`;

const Background = styled.div<{ backgroundUrl: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('${({ backgroundUrl }) => backgroundUrl}');
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

const BotTypingIndicator = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 12px 20px;
  border-radius: 30px;
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.3s ease-out;
`;

const TypingDots = styled.div`
  display: flex;
  gap: 4px;
  
  span {
    width: 8px;
    height: 8px;
    background-color: #7fc8ba;
    border-radius: 50%;
    animation: ${bounce} 1.4s infinite ease-in-out both;
    
    &:nth-of-type(1) { animation-delay: -0.32s; }
    &:nth-of-type(2) { animation-delay: -0.16s; }
    &:nth-of-type(3) { animation-delay: 0; }
  }
`;

const TypingText = styled.span`
  color: #fff;
  font-size: 14px;
  font-weight: 500;
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

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 5;
  border-radius: 20px;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #7fc8ba;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.span`
  color: #fff;
  font-size: 14px;
  margin-top: 16px;
  font-weight: 500;
`;



const ChatInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MicButton = styled.button<{ active: boolean; disabled?: boolean }>`
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  backdrop-filter: blur(10px);
  
  background: ${({ active, disabled }) =>
    disabled
      ? 'rgba(100, 100, 100, 0.3)'
      : active
        ? 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)'
        : 'rgba(0, 0, 0, 0.6)'
  };
  
  box-shadow: ${({ active }) =>
    active
      ? '0 4px 20px rgba(255, 107, 157, 0.4)'
      : '0 4px 10px rgba(0, 0, 0, 0.2)'
  };
  
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: ${({ active }) =>
      active
        ? '0 6px 24px rgba(255, 107, 157, 0.5)'
        : '0 6px 14px rgba(0, 0, 0, 0.3)'
    };
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const VoiceIndicator = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  background: ${COLORS.status.success};
  border-radius: 50%;
  border: 2px solid ${COLORS.background.primary};
  animation: ${pulse} 1s ease-in-out infinite;
`;