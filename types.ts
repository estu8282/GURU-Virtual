export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string; // The script content
  audioData?: ArrayBuffer; // Raw audio buffer for AI messages
  timestamp: Date;
  isAudioPlaying?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
