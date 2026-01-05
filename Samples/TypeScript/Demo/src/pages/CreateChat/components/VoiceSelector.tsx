import styled from '@emotion/styled';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { VoiceType, VOICE_OPTIONS } from '../types';
import { CreateChatFormData } from '../types/form';
import { COLORS, FONTS, LAYOUT } from '@/constants';

export const VoiceSelector = () => {
  const { watch, setValue } = useFormContext<CreateChatFormData>();
  const [playingVoice, setPlayingVoice] = useState<VoiceType | null>(null);

  const selectedVoice = watch('voice') as VoiceType;

  const handleVoiceSelect = (voiceType: VoiceType) => {
    if (playingVoice === voiceType) {
      setPlayingVoice(null);
    } else {
      setPlayingVoice(voiceType);
      setValue('voice', voiceType);
    }
  };

  return (
    <FormGroup>
      <FormLabel>목소리</FormLabel>
      <VoiceSelection>
        {VOICE_OPTIONS.map(voice => (
          <VoiceBtn
            key={voice.type}
            type="button"
            $active={selectedVoice === voice.type}
            onClick={() => handleVoiceSelect(voice.type)}
          >
            <VoiceIcon>
              {playingVoice === voice.type ? (
                <PauseIcon>
                  <PauseBar />
                  <PauseBar />
                </PauseIcon>
              ) : (
                <PlayIcon />
              )}
            </VoiceIcon>
            {voice.label}
          </VoiceBtn>
        ))}
      </VoiceSelection>
    </FormGroup>
  );
};

// Styled Components
const FormGroup = styled.div`
  margin-bottom: ${LAYOUT.spacing.lg};

  &:last-child {
    margin-bottom: 0;
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: ${FONTS.size.sm};
  color: ${COLORS.text.primary};
  margin-bottom: ${LAYOUT.spacing.sm};
  font-weight: ${FONTS.weight.medium};
`;

const VoiceSelection = styled.div`
  display: flex;
  gap: ${LAYOUT.spacing.sm};
  flex-wrap: wrap;
`;

const VoiceBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${LAYOUT.spacing.xs};
  padding: ${LAYOUT.spacing.sm} ${LAYOUT.spacing.md};
  background-color: ${props => (props.$active ? COLORS.accent.primary : COLORS.background.secondary)};
  border: 1px solid ${props => (props.$active ? COLORS.accent.primary : COLORS.border.primary)};
  border-radius: ${LAYOUT.borderRadius.full};
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.xs};
  cursor: pointer;
  transition: all 0.2s;
  font-family: ${FONTS.family.pretendard};

  &:hover {
    border-color: ${props => (props.$active ? COLORS.accent.primary : COLORS.border.secondary)};
    background-color: ${props => (props.$active ? COLORS.accent.hover : COLORS.background.secondary)};
  }
`;

const VoiceIcon = styled.span`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PlayIcon = styled.span`
  width: 0;
  height: 0;
  border-left: 8px solid ${COLORS.text.primary};
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
`;

const PauseIcon = styled.span`
  display: flex;
  gap: 2px;
`;

const PauseBar = styled.span`
  width: 3px;
  height: 12px;
  background-color: ${COLORS.text.primary};
`;