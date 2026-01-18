import React, { useState } from 'react';
import styled from 'styled-components';
import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterModal } from '@/components/CharacterModal';
import { COLORS, LAYOUT, FONTS } from '@/constants';
import { Character } from '@/types/character';
import { useCharacters } from '@/pages/Home/hooks/index';

interface HomeProps {
  title?: string;
  isMyCharacters?: boolean;
}

const Home: React.FC<HomeProps> = ({ 
  title = '캐릭터 모아보기', 
  isMyCharacters = false 
}) => {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useCharacters({ page: 1, size: 12 });

  const characters: Character[] = data?.content
    ? data.content
        .filter(apiChar => !isMyCharacters || apiChar.isAuthorMe)
    : [];

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStartChat = (character: Character) => {
    navigate('/chatting', { state: { character }});
    console.log(character)
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <HomeContainer>
          <SectionTitle>{title}</SectionTitle>
          <LoadingMessage>캐릭터를 불러오는 중...</LoadingMessage>
        </HomeContainer>
      </>
    );
  }

  if (error) {
    console.error('캐릭터 목록 조회 에러:', error);
    
    const isAxiosError = (err: unknown): err is { response: { status: number; data: unknown } } => {
      return typeof err === 'object' && err !== null && 'response' in err;
    };
    
    if (isAxiosError(error)) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
    
    return (
      <>
        <Navbar />
        <HomeContainer>
          <SectionTitle>{title}</SectionTitle>
          <ErrorMessage>
            <ErrorTitle>캐릭터를 불러오는데 실패했습니다</ErrorTitle>
            <ErrorDetails>
              {isAxiosError(error) ? (
                <>
                  <p>상태 코드: {error.response.status}</p>
                  {error.response.status === 500 && (
                    <p>서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
                  )}
                  {error.response.status === 401 && (
                    <p>로그인이 필요합니다.</p>
                  )}
                </>
              ) : (
                <p>{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</p>
              )}
            </ErrorDetails>
          </ErrorMessage>
        </HomeContainer>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <HomeContainer>
        <SectionTitle>{title}</SectionTitle>
        
        {characters.length === 0 ? (
          <EmptyMessage>
            {isMyCharacters ? '아직 생성한 캐릭터가 없습니다.' : '캐릭터가 없습니다.'}
          </EmptyMessage>
        ) : (
          <CharacterGrid>
            {characters.map((character) => (
              <CharacterCard 
                key={character.id} 
                character={character}
                onClick={handleCardClick}
              />
            ))}
          </CharacterGrid>
        )}
      </HomeContainer>

      <CharacterModal
        character={selectedCharacter}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStartChat={handleStartChat}
      />
    </>
  );
};

const HomeContainer = styled.main`
  padding: ${LAYOUT.spacing['md']} ${LAYOUT.spacing['6xl']};
  max-width: ${LAYOUT.container.maxWidth};
  background-color: ${COLORS.background.primary};
  margin: ${LAYOUT.navbar.height} auto 0;
  min-height: 100vh;
`;

const SectionTitle = styled.h1`
  font-size: ${FONTS.size.xl};
  font-weight: 700;
  margin-bottom: ${LAYOUT.spacing.md};
  color: ${COLORS.text.primary};
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${LAYOUT.card.width}, 1fr));
  gap: ${LAYOUT.spacing.md};
  margin-top: ${LAYOUT.spacing.md};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: ${LAYOUT.spacing['2xl']};
  color: ${COLORS.text.secondary};
  font-size: ${FONTS.size.md};
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: ${LAYOUT.spacing['2xl']};
`;

const ErrorTitle = styled.h2`
  color: ${COLORS.status.error};
  font-size: ${FONTS.size.lg};
  margin-bottom: ${LAYOUT.spacing.md};
`;

const ErrorDetails = styled.div`
  color: ${COLORS.text.secondary};
  font-size: ${FONTS.size.md};
  
  p {
    margin: ${LAYOUT.spacing.xs} 0;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: ${LAYOUT.spacing['2xl']};
  color: ${COLORS.text.secondary};
  font-size: ${FONTS.size.md};
`;

export default Home;