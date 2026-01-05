import styled from '@emotion/styled';
import { useFormContext } from 'react-hook-form';
import { CreateChatFormData } from '../types/form';

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
