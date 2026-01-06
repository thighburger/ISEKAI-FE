import { axiosClient } from '@/api/client';

export interface GenerateCharacterRequest {
  uuid: string;
  prompt: string; 
}

export interface GenerateCharacterResponse {
  previewUrl: string;
  uuid: string;
  expirationTime: string;
}

/**
 * 외모 텍스트를 전달하고 Live2D 캐릭터 ZIP 파일 URL을 받아옴
 */
export const generateCharacter = async (request: GenerateCharacterRequest): Promise<GenerateCharacterResponse> => {
  const response = await axiosClient.post<GenerateCharacterResponse>(
    '/characters/live2d',
    request
  );
  return response.data;
};
