import styled from '@emotion/styled';
import { useForm, FormProvider } from 'react-hook-form';
import { CreateChatFormData } from './types/form';
import { Navbar } from '@/components/Navbar'
import { COLORS, LAYOUT, FONTS } from '@/constants';
import {
  NameInput,
  AppearanceInput,
  PersonalityInput,
  VoiceSelector,
  BackgroundInput
} from './components';
import { useSaveCharacter } from './hooks';
import { useRef } from 'react';

const CreateChatPage = () => {
  const uuidRef = useRef(crypto.randomUUID());

  const methods = useForm<CreateChatFormData>({
    defaultValues: {
      name: '',
      persona: '',
      voice: '',
    }
  });

  const { handleSubmit, watch } = methods;

  // Save character mutation
  const saveCharacterMutation = useSaveCharacter();

  const onSubmit = async (data: CreateChatFormData) => {
    try {
      const result = await saveCharacterMutation.mutateAsync({
        uuid: uuidRef.current,
        name: data.name,
        persona:data.persona,
        voice:data.voice,
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
    formValues.name?.trim() && formValues.persona?.trim();

  return (
    <>
      <Navbar />
      <FormProvider {...methods}>
        <Container>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Section>
                <SectionTitle>캐릭터 설정</SectionTitle>
                <Card>
                  <NameInput />

                  <AppearanceInput uuid={uuidRef.current}/>

                  <PersonalityInput />

                  <VoiceSelector />
                </Card>
              </Section>

              <Section>
                <SectionTitle>배경 설정</SectionTitle>
                <Card>
                  <BackgroundInput uuid={uuidRef.current} />
                </Card>
              </Section>

              <SaveSection>
                <SaveBtn type="submit" disabled={!isFormValid || saveCharacterMutation.isPending}>
                  {saveCharacterMutation.isPending ? '저장 중...' : '저장하기'}
                </SaveBtn>
              </SaveSection>
            </form>
        </Container>
      </FormProvider>
    </>
  );
};

export default CreateChatPage;

// Styled Components
const Container = styled.div`
  padding: ${LAYOUT.spacing.md} ${LAYOUT.spacing['6xl']};
  max-width: ${LAYOUT.container.maxWidth};
  background-color: ${COLORS.background.primary};
  margin: ${LAYOUT.navbar.height} auto 0;
  min-height: 100vh;
`;

const Section = styled.section`
  margin-bottom: ${LAYOUT.spacing['2xl']};
`;

const SectionTitle = styled.h2`
  font-size: ${FONTS.size.lg};
  font-weight: ${FONTS.weight.semibold};
  margin-bottom: ${LAYOUT.spacing.md};
  color: ${COLORS.text.primary};
`;

const Card = styled.div`
  background-color: ${COLORS.background.tertiary};
  border-radius: ${LAYOUT.borderRadius.lg};
  padding: ${LAYOUT.spacing.lg};
  border: 1px solid ${COLORS.border.primary};
`;

const SaveSection = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${LAYOUT.spacing['2xl']};
  padding-bottom: ${LAYOUT.spacing['2xl']};
`;

const SaveBtn = styled.button`
  padding: ${LAYOUT.spacing.sm} ${LAYOUT.spacing.xl};
  background-color: ${COLORS.accent.primary};
  border: none;
  border-radius: ${LAYOUT.borderRadius.md};
  color: ${COLORS.text.primary};
  font-size: ${FONTS.size.md};
  font-weight: ${FONTS.weight.medium};
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