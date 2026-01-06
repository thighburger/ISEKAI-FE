import { axiosClient } from '@/api/client';

export interface GenerateBackgroundRequest {
  uuid: string;
  prompt: string;
}

export interface GenerateBackgroundResponse {
  previewUrl: string;
  uuid: string;
  expirationTime: string;
}

/**
 * 배경 설명 텍스트를 전달하고 배경 이미지 URL을 받아옴
 */
export const generateBackground = async (
  request: GenerateBackgroundRequest
): Promise<GenerateBackgroundResponse> => {
  const response = await axiosClient.post<GenerateBackgroundResponse>(
    '/characters/background-image',
    request
  );
  return response.data;
};
