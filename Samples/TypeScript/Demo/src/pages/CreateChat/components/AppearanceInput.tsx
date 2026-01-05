import styled from '@emotion/styled';
import { useFormContext } from 'react-hook-form';
import Live2DViewer from '@/components/Live2DViewer';
import { useGenerateCharacter } from '../hooks';
import { CreateChatFormData } from '../types/form';

export const AppearanceInput = () => {
  const { register, watch, setValue } = useFormContext<CreateChatFormData>();
  const { mutate, data, isPending } = useGenerateCharacter();

  const appearanceValue = watch('appearance');

  const handlePreview = () => {
    if (!appearanceValue?.trim()) return;
    mutate(appearanceValue, {
      onSuccess: response => {
        setValue('live2dFileName', response.live2dFileName);
      }
    });
  };

  return (
    <FormGroup>
      <FormLabel>외모</FormLabel>
      <FormTextarea placeholder="캐릭터 외모를 묘사해주세요." {...register('appearance')} />
      <PreviewSection>
        <PreviewHeader>
          <PreviewBtn
            type="button"
            onClick={handlePreview}
            disabled={isPending || !appearanceValue?.trim()}
          >
            {isPending ? '생성 중...' : '미리보기'}
          </PreviewBtn>
        </PreviewHeader>
        <PreviewImageContainer>
          {data?.zipUrl ? (
            <Live2DViewer modelUrl={data.zipUrl} />
          ) : (
            <PreviewPlaceholder>캐릭터 미리보기</PreviewPlaceholder>
          )}
        </PreviewImageContainer>
      </PreviewSection>
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

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px 15px;
  background-color: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #ff4d4d;
  }

  &::placeholder {
    color: #666;
  }
`;

const PreviewSection = styled.div`
  margin-top: 15px;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
`;

const PreviewBtn = styled.button`
  padding: 8px 16px;
  background-color: #ff4d4d;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #ff3333;
  }

  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const PreviewImageContainer = styled.div`
  aspect-ratio: 1;
  margin: 0 auto;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: hide;
`;

const PreviewPlaceholder = styled.span`
  color: #666;
  font-size: 14px;
`;
