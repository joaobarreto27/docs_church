export type UserRole = 'pastor' | 'obreiro' | 'controlador';

export type BlockType = 
  | 'header' 
  | 'visitors' 
  | 'prayer' 
  | 'youtube' 
  | 'opportunities' 
  | 'choirs' 
  | 'custom';

export interface VisitorItem {
  id: string;
  name: string;
  church?: string;
  invited_by?: string;
}

export interface PrayerItem {
  id: string;
  description: string;
  urgent?: boolean;
  image_data?: string; // Print comprimido em base64 (~30-40KB) do chat do YouTube
  created_at?: number;
}

export interface OpportunityItem {
  id: string;
  name: string;
}

export interface ChoirItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface CustomContent {
  text: string;
}

export interface LiturgicalBlock {
  id: string;
  room_id: string;
  block_type: BlockType;
  title: string;
  content: any; // VisitorItem[] | PrayerItem[] | ChoirItem[] | OpportunityItem[] | CustomContent
  order_index: number;
  sheet_assignment: number; // 1: Folha Esquerda, 2: Folha Direita
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: string;
  code: string;
  title: string;
  service_date: string;
  controller_pin?: string;
  active_alert: string | null;
  current_page: number;
  version: number;
  status: 'active' | 'archived';
  created_at?: string;
  updated_at?: string;
}
