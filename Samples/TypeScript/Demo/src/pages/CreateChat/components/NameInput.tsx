import styled from '@emotion/styled';
import { useFormContext } from 'react-hook-form';
import { CreateChatFormData } from '../types/form';

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
          {nameValue.length} /{maxLength}
        </CharCount>
      </InputWrapper>
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

const InputWrapper = styled.div`
  position: relative;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  background-color: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #ff4d4d;
  }

  &::placeholder {
    color: #666;
  }
`;

const CharCount = styled.span`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 12px;
`;
