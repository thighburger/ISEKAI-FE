import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface GenerateBackgroundRequest {
  description: string;
}

export interface GenerateBackgroundResponse {
  imageUrl: string;
}

/**
 * 배경 설명 텍스트를 전달하고 배경 이미지 URL을 받아옴
 */
export const generateBackground = async (
  description: string
): Promise<GenerateBackgroundResponse> => {
  const response = await axios.post<GenerateBackgroundResponse>(
    `${API_BASE_URL}/background/generate`,
    { description }
  );
  return response.data;
};
