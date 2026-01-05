import styled from '@emotion/styled';
import { useFormContext } from 'react-hook-form';
import { CreateChatFormData } from '../types/form';
import { COLORS, FONTS, LAYOUT } from '@/constants';

interface NameInputProps {
  maxLength?: number;
}

export const NameInput = ({ maxLength = 20 }: NameInputProps) => {
  const { register, watch } = useFormContext<CreateChatFormData>();
  const nameValue = watch('name') || '';

  return (
    <FormGroup>
      <FormLabel>이름</FormLabel>
      <InputWrapper>
        <FormInput
          type="text"
          placeholder="캐릭터 이름을 설정해주세요."
          {...register('name', {
            maxLength,
            setValueAs: v => v.slice(0, maxLength)
          })}
          maxLength={maxLength}
        />
        <CharCount>
          {nameValue.length} / {maxLength}
        </CharCount>
      </InputWrapper>
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

const InputWrapper = styled.div`
  position: relative;
`;

const FormInput = styled.input`
  width: 100%;
  padding: ${LAYOUT.spacing.md} ${LAYOUT.spacing.md};
  background-color: ${COLORS.background.secondary};
  border: 1px solid ${COLORS.border.primary};
  border-radius: ${LAYOUT.borderRadius.md};
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.sm};
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: ${FONTS.family.pretendard};

  &:focus {
    border-color: ${COLORS.accent.primary};
  }

  &::placeholder {
    color: ${COLORS.text.tertiary};
  }
`;

const CharCount = styled.span`
  position: absolute;
  right: ${LAYOUT.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  color: ${COLORS.text.tertiary};
  font-size: ${FONTS.size.xs};
`;