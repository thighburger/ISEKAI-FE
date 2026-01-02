import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface GenerateCharacterRequest {
  appearance: string;
}

export interface GenerateCharacterResponse {
  zipUrl: string;
}

/**
 * 외모 텍스트를 전달하고 Live2D 캐릭터 ZIP 파일 URL을 받아옴
 */
export const generateCharacter = async (appearance: string): Promise<GenerateCharacterResponse> => {
  const response = await axios.post<GenerateCharacterResponse>(
    `${API_BASE_URL}/character/generate`,
    { appearance }
  );
  return response.data;
};
