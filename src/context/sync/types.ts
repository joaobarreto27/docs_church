import { UserRole } from '../../types/liturgy';

export interface PollingConfig {
  role: UserRole | null;
  isPulpitPreviewActive: boolean;
  lastActivityTime: number;
}

export interface PollingIntervalResult {
  interval: number;
  isFast: boolean;
}
