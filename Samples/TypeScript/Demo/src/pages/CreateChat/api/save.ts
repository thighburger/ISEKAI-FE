import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface SaveCharacterRequest {
  name: string;
  live2dFileName: string;
  personality: string;
  voice: string;
  backgroundFileName: string;
}

export interface SaveCharacterResponse {
  success: boolean;
  characterId: string;
  message?: string;
}

/**
 * 캐릭터 데이터를 서버에 저장
 */
export const saveCharacter = async (
  characterData: SaveCharacterRequest
): Promise<SaveCharacterResponse> => {
  const response = await axios.post<SaveCharacterResponse>(
    `${API_BASE_URL}/character/save`,
    characterData
  );
  return response.data;
};
