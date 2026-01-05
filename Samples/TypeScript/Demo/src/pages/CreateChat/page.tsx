import styled from '@emotion/styled';
import { useForm, FormProvider } from 'react-hook-form';
import { CreateChatFormData } from './types/form';
import {
  NameInput,
  AppearanceInput,
  PersonalityInput,
  VoiceSelector,
  BackgroundInput
} from './components';
import { useSaveCharacter } from './hooks';

const CreateChatPage = () => {
  const methods = useForm<CreateChatFormData>({
    defaultValues: {
      name: '',
      appearance: '',
      personality: '',
      voice: 'cute',
      background: '',
      live2dFileName: '',
      backgroundFileName: ''
    }
  });

  const { handleSubmit, watch } = methods;

  // Save character mutation
  const saveCharacterMutation = useSaveCharacter();

  const onSubmit = async (data: CreateChatFormData) => {
    try {
      const result = await saveCharacterMutation.mutateAsync({
        name: data.name,
        live2dFileName: data.live2dFileName,
        personality: data.personality,
        voice: data.voice,
        backgroundFileName: data.backgroundFileName
      });
      console.log('캐릭터 저장 성공:', result);
      alert('캐릭터가 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('캐릭터 저장 실패:', error);
      alert('캐릭터 저장에 실패했습니다.');
    }
  };

  const formValues = watch();
  const isFormValid =
    formValues.name?.trim() && formValues.appearance?.trim() && formValues.personality?.trim();

  return (
    <FormProvider {...methods}>
      <Container>
        <MainContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Section>
              <SectionTitle>캐릭터 설정</SectionTitle>
              <Card>
                <NameInput />

                <AppearanceInput />

                <PersonalityInput />

                <VoiceSelector />
              </Card>
            </Section>

            <Section>
              <SectionTitle>배경 설정</SectionTitle>
              <Card>
                <BackgroundInput />
              </Card>
            </Section>

            <SaveSection>
              <SaveBtn type="submit" disabled={!isFormValid || saveCharacterMutation.isPending}>
                {saveCharacterMutation.isPending ? '저장 중...' : '저장하기'}
              </SaveBtn>
            </SaveSection>
          </form>
        </MainContent>
      </Container>
    </FormProvider>
  );
};

export default CreateChatPage;

// Styled Components
const Container = styled.div`
  background-color: #1a1a1a;
  color: #fff;
  padding: 20px;
`;

const MainContent = styled.main`
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Section = styled.section`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #fff;
`;

const Card = styled.div`
  background-color: #2a2a2a;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;
`;

const SaveSection = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
  padding-bottom: 30px;
`;

const SaveBtn = styled.button`
  padding: 12px 24px;
  background-color: #ff4d4d;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
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
