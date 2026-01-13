// src/components/CharacterModal.tsx
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { COLORS, LAYOUT, FONTS } from '@/constants';
import { Character } from '@/types/character';

interface CharacterModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (character: Character) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  character,
  isOpen,
  onClose,
  onStartChat,
}) => {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!character) return null;

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(character);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay $active={isOpen} onClick={handleOverlayClick}>
      <ModalContainer $active={isOpen}>
        <CloseButton onClick={onClose} />
        
        <ModalImage $hasImage={!!character.thumbnailUrl}>
          {character.thumbnailUrl ? (
            <img src={character.thumbnailUrl} alt={character.name} />
          ) : (
            <span>{character.name}</span>
          )}
        </ModalImage>

        <ModalContent>
          <ModalTextContent>
            <ModalTitle>{character.name}</ModalTitle>
            <ModalDescription>{character.persona}</ModalDescription>
          </ModalTextContent>

          <StartChatButton onClick={handleStartChat}>
            대화 시작하기
          </StartChatButton>
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div<{ $active: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: ${props => props.$active ? 1 : 0};
  visibility: ${props => props.$active ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease-out, visibility 0.3s ease-out;
`;

const ModalContainer = styled.div<{ $active: boolean }>`
  background-color: ${COLORS.background.secondary};
  border-radius: ${LAYOUT.borderRadius.xl};
  width: 90%;
  max-width: 500px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  transform: scale(${props => props.$active ? 1 : 0.9});
  transition: transform 0.3s ease-out;
  position: relative;

  /* 스크롤바 숨기기 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

const ModalImage = styled.div<{ $hasImage: boolean }>`
  width: 100%;
  flex-shrink: 0;
  aspect-ratio: 1 / 1;
  background-color: ${COLORS.card.bg};
  position: relative;
  overflow: hidden;
  border-top-left-radius: ${LAYOUT.borderRadius.xl};
  border-top-right-radius: ${LAYOUT.borderRadius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: ${COLORS.card.text};
  font-weight: 600;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* 이미지 아래쪽 페이드아웃 그라데이션 */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0) 50%,
      ${COLORS.background.secondary} 100%
    );
    pointer-events: none;
  }
`;

const ModalContent = styled.div`
  padding: ${LAYOUT.spacing.xl};
  margin-top: calc(${LAYOUT.spacing.xl} * -2);
  position: relative;
  z-index: 1;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const ModalTextContent = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const ModalTitle = styled.h2`
  font-size: ${FONTS.size['3xl']};
  font-weight: ${FONTS.weight.bold};
  color: ${COLORS.text.primary};
  margin-bottom: ${LAYOUT.spacing.md};
`;

const ModalDescription = styled.p`
  font-size: ${FONTS.size.md};
  color: ${COLORS.text.secondary};
  margin-bottom: ${LAYOUT.spacing.xl};
`;

const StartChatButton = styled.button`
  width: 100%;
  padding: ${LAYOUT.spacing.md};
  background-color: ${COLORS.accent.primary};
  color: ${COLORS.white};
  border: none;
  border-radius: ${LAYOUT.borderRadius.lg};
  font-size: ${FONTS.size.lg};
  font-weight: ${FONTS.weight.semibold};
  cursor: pointer;
  transition: background-color 0.3s ease-out;

  &:hover {
    background-color: ${COLORS.accent.secondary};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${LAYOUT.spacing.md};
  right: ${LAYOUT.spacing.md};
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: ${LAYOUT.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease-out;
  z-index: 1;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 2px;
    background-color: ${COLORS.white};
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
`;