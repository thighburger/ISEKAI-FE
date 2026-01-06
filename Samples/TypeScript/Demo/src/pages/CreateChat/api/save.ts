import { axiosClient } from '@/api/client';

export interface SaveCharacterRequest {
  uuid: string;
  name: string;
  persona: string;
  voice: string;
}

/**
 * 캐릭터 데이터를 서버에 저장
 */
export const saveCharacter = async (
  characterData: SaveCharacterRequest
) => {
  const response = await axiosClient.post(
    '/characters/confirm',
    characterData
  );
  return response.data;
};  
