import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  ta?: boolean;
}

export function QRScanner({ onScan, onClose, ta }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode("reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.stop().then(() => onScan(decodedText));
            }
          },
          () => {} // Ignore errors
        );
      } catch (err) {
        console.error("Camera access failed", err);
        alert(ta ? 'கேமராவை பயன்படுத்த முடியவில்லை.' : 'Failed to access camera.');
        onClose();
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, onClose, ta]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white active:scale-95 transition-transform"
      >
        <X className="size-6" />
      </button>
      
      <div className="w-full max-w-sm">
        <h2 className={`text-white text-xl font-bold text-center mb-6 ${ta ? 'font-tamil' : 'font-display'}`}>
          {ta ? 'QR கோடை ஸ்கேன் செய்யவும்' : 'Scan QR Code'}
        </h2>
        
        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative">
          <div id="reader" className="w-full aspect-square" />
        </div>
        
        <p className={`text-white/60 text-sm text-center mt-6 ${ta ? 'font-tamil' : 'font-display'}`}>
          {ta ? 'கடையின் QR-ஐ கட்டத்திற்குள் காட்டவும்.' : 'Point your camera at the Shop QR code.'}
        </p>
      </div>
    </div>
  );
}
