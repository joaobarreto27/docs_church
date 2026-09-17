export type HolyricsSlideType = 'music' | 'bible' | 'announcement' | 'text';

export interface HolyricsSlide {
  text: string;
  title?: string;
  author?: string;
  slide_number?: number;
  total_slides?: number;
  type?: HolyricsSlideType;
  updated_at?: number;
}

export interface HolyricsConnectionState {
  url: string | null;
  isConnected: boolean;
  isProjecting: boolean;
  currentSlide: HolyricsSlide | null;
  error: string | null;
}
