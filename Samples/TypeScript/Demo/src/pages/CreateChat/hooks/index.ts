import { useMutation } from '@tanstack/react-query';
import {
  generateCharacter,
  GenerateCharacterResponse,
  generateBackground,
  GenerateBackgroundResponse
} from '../api';

/**
 * 캐릭터 생성 뮤테이션 훅
 */
export const useGenerateCharacter = () => {
  return useMutation<GenerateCharacterResponse, Error, string>({
    mutationFn: generateCharacter
  });
};

/**
 * 배경 생성 뮤테이션 훅
 */
export const useGenerateBackground = () => {
  return useMutation<GenerateBackgroundResponse, Error, string>({
    mutationFn: generateBackground
  });
};
