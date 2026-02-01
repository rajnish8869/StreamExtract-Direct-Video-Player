export interface StreamResult {
  url: string;
  contentType: string | null;
  title?: string;
  description?: string;
  siteName?: string;
  poster?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface ExtractionResponse {
  success: boolean;
  data?: StreamResult;
  error?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}