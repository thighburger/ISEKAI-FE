export type VoiceType = 'cute' | 'innocent' | 'sexy';

export interface VoiceOption {
  type: VoiceType;
  label: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { type: 'cute', label: '귀여운 목소리' },
  { type: 'innocent', label: '청순한 목소리' },
  { type: 'sexy', label: '섹시한 목소리' }
];
