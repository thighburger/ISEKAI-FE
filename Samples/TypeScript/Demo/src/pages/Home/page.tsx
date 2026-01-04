// src/pages/Home.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Navbar } from '@/components/Navbar';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterModal } from '@/components/CharacterModal';
import { COLORS, LAYOUT, FONTS } from '@/constants';
import { Character } from '@/types/character';

const Home: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 임시 데이터 (추후 API로 대체)
  const characters: Character[] = [
    {
      id: '1',
      title: '캐릭터 1',
      description: '캐릭터 설명입니다. 이것은 샘플 캐릭터의 상세 설명입니다.',
      imageUrl: 'https://picsum.photos/240/180?random=1'
    },
    {
      id: '2',
      title: '캐릭터 2',
      description: '캐릭터 설명입니다. 이것은 샘플 캐릭터의 상세 설명입니다.',
      imageUrl: 'https://picsum.photos/240/180?random=2'
    },
    {
      id: '3',
      title: '캐릭터 2',
      description: '캐릭터 설명입니다. 이것은 샘플 캐릭터의 상세 설명입니다.',
      imageUrl: 'https://picsum.photos/240/180?random=3'
    },
    {
      id: '4',
      title: '캐릭터 2',
      description: '캐릭터 설명입니다. 이것은 샘플 캐릭터의 상세 설명입니다.',
      imageUrl: 'https://picsum.photos/240/180?random=4'
    },
  ];

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStartChat = (character: Character) => {
    console.log('대화 시작:', character.title);
    // 추후 채팅 페이지로 이동 또는 채팅 시작 로직
  };

  return (
    <>
      <Navbar />
      <HomeContainer>
        <SectionTitle>부제목입니다</SectionTitle>
        
        <CharacterGrid>
          {characters.map((character) => (
            <CharacterCard 
              key={character.id} 
              character={character}
              onClick={handleCardClick}
            />
          ))}
        </CharacterGrid>
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

export default Home;