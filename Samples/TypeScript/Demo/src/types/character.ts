export interface Character {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  badge?: string;
}

export interface CharacterCardProps {
  character: Character;
  onClick?: (character: Character) => void;
}