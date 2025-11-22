export interface AudioFile {
  name: string;
  url: string;
  originalFile: File;
}

export enum PlayerState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
}

export enum ScreenMode {
  MENU = 'MENU',
  NOW_PLAYING = 'NOW_PLAYING',
}

export interface PlayerContextType {
  files: AudioFile[];
  currentIndex: number;
  playerState: PlayerState;
  volume: number;
  currentTime: number;
  duration: number;
}
