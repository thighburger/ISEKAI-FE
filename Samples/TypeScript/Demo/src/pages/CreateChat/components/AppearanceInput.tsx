import styled from '@emotion/styled';
import Live2DViewer from '@/components/Live2DViewer';
import { useGenerateCharacter } from '../hooks';
import { COLORS, FONTS, LAYOUT } from '@/constants';
import { useState } from 'react'; 

export const AppearanceInput = ({ uuid }: { uuid: string }) => {
  const { mutate, data, isPending } = useGenerateCharacter();
  const [prompt, setPrompt] = useState<string>('');

  const handlePreview = () => {
    if (!prompt?.trim()) return;
    mutate({ uuid, prompt });
  };

  return (
    <FormGroup>
      <FormLabel>외모</FormLabel>
      <FormTextarea
        placeholder="캐릭터 외모를 묘사해주세요."
        onChange={e => setPrompt(e.target.value)}
      />
      <PreviewSection>
        <PreviewHeader>
          <PreviewBtn type="button" onClick={handlePreview} disabled={isPending || !prompt?.trim()}>
            {isPending ? '생성 중...' : '미리보기'}
          </PreviewBtn>
        </PreviewHeader>
        <PreviewImageContainer>
          {data?.previewUrl ? (
            <Live2DViewer modelUrl={data.previewUrl} />
          ) : (
            <PreviewPlaceholder>캐릭터 미리보기</PreviewPlaceholder>
          )}
        </PreviewImageContainer>
      </PreviewSection>
    </FormGroup>
  );
};

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

const FormTextarea = styled.textarea`
  width: 100%;
  padding: ${LAYOUT.spacing.md} ${LAYOUT.spacing.md};
  background-color: ${COLORS.background.secondary};
  border: 1px solid ${COLORS.border.primary};
  border-radius: ${LAYOUT.borderRadius.md};
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.sm};
  outline: none;
  resize: vertical;
  min-height: 80px;
  font-family: ${FONTS.family.pretendard};
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: ${COLORS.accent.primary};
  }

  &::placeholder {
    color: ${COLORS.text.tertiary};
  }
`;

const PreviewSection = styled.div`
  margin-top: ${LAYOUT.spacing.md};
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${LAYOUT.spacing.sm};
`;

const PreviewBtn = styled.button`
  padding: ${LAYOUT.spacing.xs} ${LAYOUT.spacing.md};
  background-color: ${COLORS.accent.primary};
  border: none;
  border-radius: ${LAYOUT.borderRadius.sm};
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.xs};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.accent.hover};
  }

  &:disabled {
    background-color: ${COLORS.text.disabled};
    cursor: not-allowed;
    opacity: ${COLORS.opacity.disabled};
  }
`;

const PreviewImageContainer = styled.div`
  aspect-ratio: 1;
  max-width: ${LAYOUT.preview.appearanceMaxWidth};
  margin: 0 auto;
  background-color: ${COLORS.background.secondary};
  border-radius: ${LAYOUT.borderRadius.md};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PreviewPlaceholder = styled.span`
  color: ${COLORS.text.tertiary};
  font-size: ${FONTS.size.sm};
`;
