// src/components/CharacterCard.tsx
import React from 'react';
import styled from 'styled-components';
import { COLORS, LAYOUT, FONTS } from '@/constants';
import { CharacterCardProps } from '@/types/character';

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(character);
    }
  };

  return (
    <CardContainer onClick={handleClick}>
      <CardImage $hasImage={!!character.imageUrl}>
        {character.imageUrl ? (
          <img src={character.imageUrl} alt={character.title} />
        ) : (
          <span>{character.title}</span>
        )}
        {character.badge && (
          <Badge>{character.badge}</Badge>
        )}
      </CardImage>
      
      <CardContent>
        <CardTitle>{character.title}</CardTitle>
        <CardDescription>{character.description}</CardDescription>
      </CardContent>
    </CardContainer>
  );
};

const CardContainer = styled.div`
  background-color: ${COLORS.card.bg};
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  height: ${LAYOUT.card.height};
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${COLORS.shadow.lg};
  }
`;

const CardImage = styled.div<{ $hasImage: boolean }>`
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background-color: ${COLORS.card.bg};
  border-radius: ${LAYOUT.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: ${COLORS.card.text};
  font-weight: 600;
  position: ${props => props.$hasImage ? 'relative' : 'static'};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    user-select: none;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: ${LAYOUT.spacing.xs};
  right: ${LAYOUT.spacing.xs};
  background-color: ${COLORS.accent.primary};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const CardContent = styled.div`
  padding: ${LAYOUT.spacing.sm};
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: ${COLORS.card.bg};
`;

const CardTitle = styled.h3`
  font-size: ${FONTS.size.cardTitle};
  font-weight: ${FONTS.weight.extrabold};
  color: ${COLORS.card.text};
  margin-bottom: ${LAYOUT.spacing.xs};
`;

const CardDescription = styled.p`
  font-size: ${FONTS.size.cardDesc};
  font-weight: ${FONTS.weight.regular};
  color: ${COLORS.card.describe};
  line-height: 1.5;
  opacity: 0.8;
`;