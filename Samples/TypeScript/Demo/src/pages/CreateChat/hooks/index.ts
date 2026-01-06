import { useMutation } from '@tanstack/react-query';
import {
  generateCharacter,
  GenerateCharacterResponse,
  GenerateCharacterRequest,
  generateBackground,
  GenerateBackgroundResponse,
  GenerateBackgroundRequest,
  saveCharacter,
  SaveCharacterRequest,
} from '../api';

/**
 * 캐릭터 생성 뮤테이션 훅
 */
export const useGenerateCharacter = () => {
  return useMutation<GenerateCharacterResponse, Error, GenerateCharacterRequest>({
    mutationFn: generateCharacter
  });
};

/**
 * 배경 생성 뮤테이션 훅
 */
export const useGenerateBackground = () => {
  return useMutation<GenerateBackgroundResponse, Error, GenerateBackgroundRequest>({
    mutationFn: generateBackground
  });
};

// 캐릭터 저장 뮤테이션 훅
export const useSaveCharacter = () => {
  return useMutation<any,Error, SaveCharacterRequest>({
    mutationFn: saveCharacter,
  });
};
