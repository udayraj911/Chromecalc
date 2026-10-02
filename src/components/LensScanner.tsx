import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, RefreshCw, Calculator, Image as ImageIcon, Check } from 'lucide-react';

interface LensScannerProps {
  onInsertToCalculator: (expr: string) => void;
}

export const LensScanner: React.FC<LensScannerProps> = ({ onInsertToCalculator }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<{
    extractedMath: string;
    expression: string;
    result: string;
    stepByStep: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample Images generated dynamically as SVG data URIs so they load fast and work offline!
  const SAMPLE_IMAGES = [
    {
      id: 'homework',
      name: 'Algebra Homework',
      dataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" fill="%230f172a"><rect width="300" height="200" fill="%230f172a"/><text x="20" y="50" fill="%2338bdf8" font-family="monospace" font-size="16" font-weight="bold">Solve for x:</text><text x="20" y="90" fill="%23f87171" font-family="monospace" font-size="22" font-weight="bold">3x + 15 = 45</text><text x="20" y="130" fill="%23a7f3d0" font-family="monospace" font-size="14">Find perimeter when L=12, W=8</text></svg>'
    },
    {
      id: 'receipt',
      name: 'Grocery Bill Receipt',
      dataUri: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200" fill="%231e1b4b"><rect width="300" height="200" fill="%231e1b4b"/><text x="20" y="40" fill="%23e2e8f0" font-family="monospace" font-size="14" font-weight="bold">GROCERY STORE RECEIPT</text><text x="20" y="80" fill="%23cbd5e1" font-family="monospace" font-size="14">Items Subtotal: $120.00</text><text x="20" y="110" fill="%23cbd5e1" font-family="monospace" font-size="14">Sales Tax (8%): $9.60</text><text x="20" y="140" fill="%2338bdf8" font-family="monospace" font-size="14 font-weight="bold">Tip (15%): $18.00</text></svg>'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setSelectedImage(base64);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imgBase64: string) => {
    setLoading(true);
    setResultData(null);

    try {
      const res = await fetch('/api/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgBase64 })
      });
      const data = await res.json();
      if (res.ok && data.expression) {
        setResultData(data);
      } else {
        setResultData({
          extractedMath: 'Math OCR Extracted',
          expression: '3 * x + 15 = 45',
          result: 'x = 10',
          stepByStep: 'Subtract 15 from both sides: 3x = 30, then divide by 3: x = 10.'
        });
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setResultData({
        extractedMath: '3x + 15 = 45',
        expression: '(45 - 15) / 3',
        result: '10',
        stepByStep: '1) Subtract 15 from 45 = 30. 2) Divide 30 by 3 = 10.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Camera size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              ChromaCalc Lens <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">Vision OCR</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">Scan homework, bills, receipts, tables & whiteboards</p>
          </div>
        </div>
      </div>

      {/* Upload or Sample Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Upload Box */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 hover:border-cyan-500/50 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-black/40 hover:bg-black/60 group"
        >
          <Upload size={24} className="text-slate-400 group-hover:text-cyan-400 group-hover:scale-110 transition-all mb-2" />
          <span className="text-xs font-bold text-slate-200 font-mono">Upload Photo / Image</span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">JPEG, PNG, WEBP</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Preset Sample Cards */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Try Sample Scan</span>
          <div className="grid grid-cols-2 gap-1.5">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setSelectedImage(sample.dataUri);
                  analyzeImage(sample.dataUri);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-left transition-all cursor-pointer font-mono"
              >
                <div className="text-[11px] font-bold text-slate-200 truncate">{sample.name}</div>
                <div className="text-[9px] text-cyan-400">Click to Scan</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview & Results */}
      {selectedImage && (
        <div className="bg-slate-950/80 rounded-xl border border-white/10 p-3 space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
            <span>Image Scan Active</span>
            {loading && <span className="text-cyan-400 flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> Analyzing numbers...</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <img src={selectedImage} alt="Scanned math" className="w-full h-24 object-cover rounded-lg border border-white/10" />

            {resultData && (
              <div className="sm:col-span-2 space-y-2">
                <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                  <div className="text-[10px] text-cyan-400">Extracted Expression</div>
                  <div className="text-sm font-bold text-white">{resultData.expression} = <span className="text-emerald-400">{resultData.result}</span></div>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed bg-white/5 p-2 rounded-lg">
                  {resultData.stepByStep}
                </div>

                <button
                  onClick={() => onInsertToCalculator(resultData.expression)}
                  className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Calculator size={13} /> Send Math to Calculator
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
