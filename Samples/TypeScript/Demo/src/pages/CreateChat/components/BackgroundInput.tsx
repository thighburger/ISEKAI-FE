import styled from '@emotion/styled';
import { useFormContext } from 'react-hook-form';
import { useGenerateBackground } from '../hooks';
import { CreateChatFormData } from '../types/form';

export const BackgroundInput = () => {
  const { register, watch, setValue } = useFormContext<CreateChatFormData>();
  const { mutate, data, isPending } = useGenerateBackground();

  const backgroundValue = watch('background');

  const handlePreview = () => {
    if (!backgroundValue?.trim()) return;
    mutate(backgroundValue, {
      onSuccess: response => {
        setValue('backgroundFileName', response.backgroundFileName);
      }
    });
  };

  return (
    <FormGroup>
      <FormLabel>배경</FormLabel>
      <FormTextarea placeholder="배경화면을 설명해주세요." {...register('background')} />
      <PreviewSection>
        <PreviewHeader>
          <PreviewBtn
            type="button"
            onClick={handlePreview}
            disabled={isPending || !backgroundValue?.trim()}
          >
            {isPending ? '생성 중...' : '미리보기'}
          </PreviewBtn>
        </PreviewHeader>
        <BackgroundPreviewContainer>
          {data?.imageUrl ? (
            <PreviewImage src={data.imageUrl} alt="배경 미리보기" />
          ) : (
            <PreviewPlaceholder>배경 미리보기</PreviewPlaceholder>
          )}
        </BackgroundPreviewContainer>
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

const BackgroundPreviewContainer = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
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
  object-fit: cover;
`;

const PreviewPlaceholder = styled.span`
  color: #666;
  font-size: 14px;
`;
