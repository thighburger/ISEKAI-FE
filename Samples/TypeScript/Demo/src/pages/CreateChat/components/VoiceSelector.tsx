import styled from '@emotion/styled';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { VoiceType, VOICE_OPTIONS } from '../types';
import { CreateChatFormData } from '../types/form';

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
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 14px;
  color: #fff;
  margin-bottom: 8px;
  font-weight: 500;
`;

const VoiceSelection = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const VoiceBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: ${props => (props.$active ? '#ff4d4d' : '#1a1a1a')};
  border: 1px solid ${props => (props.$active ? '#ff4d4d' : '#444')};
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => (props.$active ? '#ff4d4d' : '#666')};
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
  border-left: 8px solid #fff;
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
  background-color: #fff;
`;
