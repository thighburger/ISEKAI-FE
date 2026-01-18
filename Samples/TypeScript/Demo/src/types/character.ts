export interface Character {
  id: number;
  name: string;
  persona: string;
  thumbnailUrl?: string;
  isAuthorMe: boolean;
  backgroundUrl?: string;
  live2dModelUrl?: string;
}

export interface CharacterCardProps {
  character: Character;
  onClick?: (character: Character) => void;
}

export interface ApiCharacter {
  id: number;
  author: {
    email: string;
  };
  live2dModelUrl: string;
  backgroundUrl: string;
  thumbnailUrl: string;
  name: string;
  persona: string;
  voiceId: number;
  isPublic: boolean;
  isAuthorMe: boolean;
}

export interface CharactersResponse {
  content: ApiCharacter[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}