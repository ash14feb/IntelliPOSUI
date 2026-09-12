import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'intelio-pwa-install-dismissed';

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

export default function InstallPrompt({ onNotify }: { onNotify?: (message: string, tone?: 'success' | 'error' | 'info') => void }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (isStandalone() || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    setShowIosHint(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const handleInstall = async () => {
    if (!deferred) {
      // iOS / browsers without beforeinstallprompt: show manual steps.
      if (isIos()) setShowIosHint(true);
      return;
    }
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        onNotify?.('App installed successfully', 'success');
        setDeferred(null);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    }
  };

  // iOS Safari never fires beforeinstallprompt: show the card directly.
  if (!deferred && !isIos()) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-96">
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-800">Install Intelli Billing App</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {showIosHint
                ? 'Tap Share, then "Add to Home Screen".'
                : 'Install the app on your phone for quick access and offline use.'}
            </p>
            {showIosHint && (
              <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                <Share className="h-4 w-4" /> Share → Add to Home Screen
              </p>
            )}
            <div className="mt-3 flex gap-2">
              {!showIosHint && (
                <button
                  onClick={handleInstall}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Install
                </button>
              )}
              <button
                onClick={dismiss}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                {showIosHint ? 'Close' : 'Later'}
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
