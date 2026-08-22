import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface NotificationToastState {
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface NotificationToastProps {
  notification: NotificationToastState | null;
}

export default function NotificationToast({ notification }: NotificationToastProps) {
  if (!notification) {
    return null;
  }

  const toneMap = {
    success: {
      iconComponent: CheckCircle2,
      box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      iconClass: 'text-emerald-600'
    },
    error: {
      iconComponent: AlertCircle,
      box: 'border-rose-200 bg-rose-50 text-rose-800',
      iconClass: 'text-rose-600'
    },
    info: {
      iconComponent: Info,
      box: 'border-sky-200 bg-sky-50 text-sky-800',
      iconClass: 'text-sky-600'
    }
  } as const;

  const config = toneMap[notification.tone];
  const Icon = config.iconComponent;

  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl ${config.box}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClass}`} />
      <p className="text-sm font-semibold">{notification.message}</p>
    </div>
  );
}
