import styled from '@emotion/styled';
import { useFormContext } from 'react-hook-form';
import { CreateChatFormData } from '../types/form';
import { COLORS, FONTS, LAYOUT } from '@/constants';

export const PersonalityInput = () => {
  const { register } = useFormContext<CreateChatFormData>();

  return (
    <FormGroup>
      <FormLabel>성격</FormLabel>
      <FormTextarea placeholder="캐릭터 성격을 설명해주세요." {...register('personality')} />
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