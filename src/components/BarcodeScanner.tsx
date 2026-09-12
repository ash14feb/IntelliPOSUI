import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState('');

  useEffect(() => {
    let stopped = false;
    let raf = 0;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const BD: any = (window as any).BarcodeDetector;
        if (BD) {
          const detector = new BD({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'] });
          const loop = async () => {
            if (stopped || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes?.[0]?.rawValue) {
                onDetected(codes[0].rawValue);
                cleanup();
                return;
              }
            } catch { /* keep scanning */ }
            raf = requestAnimationFrame(() => setTimeout(loop, 300));
          };
          loop();
        }
      } catch {
        if (!stopped) setError('Camera unavailable. Enter the barcode manually below.');
      }
    };

    const cleanup = () => {
      stopped = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };

    start();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Scan Barcode</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        {error ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">{error}</p>
        ) : (
          <video ref={videoRef} className="w-full h-56 object-cover rounded-2xl bg-slate-900 mb-4" playsInline muted />
        )}
        <p className="text-xs text-slate-500 mb-2">Point the camera at the barcode, or type it manually:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manual}
            onChange={e => setManual(e.target.value)}
            placeholder="e.g. 8901234567890"
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <button
            onClick={() => { if (manual.trim()) { onDetected(manual.trim()); onClose(); } }}
            className="px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  );
}
