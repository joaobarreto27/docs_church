import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface AlertBannerProps {
  alert: string | null;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alert }) => {
  if (!alert) return null;

  return (
    <aside
      aria-live="assertive"
      className="w-full bg-alert-bg border-b-2 border-alert-border px-4 py-2 flex items-center justify-center gap-3 shadow-md animate-slideDown shrink-0"
    >
      <AlertCircle className="w-5 h-5 text-alert-text shrink-0 animate-bounce" />
      <p className="font-title text-sm sm:text-base font-bold text-alert-text uppercase tracking-wide text-center">
        {alert}
      </p>
    </aside>
  );
};
