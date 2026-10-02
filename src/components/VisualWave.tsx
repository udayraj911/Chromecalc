import { useState, useEffect, useRef } from 'react';

interface VisualWaveProps {
  intensity: number; // 0 to 1 scaling factor
  color: string;      // Glow color class (e.g. text-cyan-400)
  theme: 'cyberpunk' | 'retrowave' | 'aurora';
}

export function VisualWave({ intensity, color, theme }: VisualWaveProps) {
  const [phase, setPhase] = useState(0);
  const requestRef = useRef<number>(null);

  // Speed of the wave is influenced by intensity
  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Phase changes faster with higher intensity
      const speed = 0.002 + intensity * 0.008;
      setPhase((prev) => (prev + delta * speed) % (Math.PI * 2));
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [intensity]);

  // Generate path points for a sine wave
  const getPath = (offset: number, ampMultiplier: number, freqMultiplier: number) => {
    const points = [];
    const width = 100;
    const height = 16;
    const midY = height / 2;
    
    // Base amplitude increases with intensity
    const amplitude = (1 + intensity * 4) * ampMultiplier;
    // Frequency increases with intensity
    const frequency = (0.12 + intensity * 0.1) * freqMultiplier;

    for (let x = 0; x <= width; x += 2) {
      // Sine wave equation
      const rad = (x * frequency) + phase + offset;
      const y = midY + Math.sin(rad) * amplitude;
      points.push(`${x},${y.toFixed(2)}`);
    }

    return `M 0,${midY} Q ${points.join(' ')} L 100,${midY}`;
  };

  // Determine gradients based on active theme
  const getGradientColors = () => {
    switch (theme) {
      case 'cyberpunk':
        return {
          start: '#06b6d4', // cyan-500
          end: '#ec4899',   // magenta-500
        };
      case 'retrowave':
        return {
          start: '#f59e0b', // amber-500
          end: '#f43f5e',   // rose-500
        };
      case 'aurora':
        return {
          start: '#10b981', // emerald-500
          end: '#06b6d4',   // cyan-500
        };
    }
  };

  const gradients = getGradientColors();

  return (
    <div className="w-full h-8 relative select-none overflow-hidden" id="wave-container">
      {/* Wave SVG */}
      <svg
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        className="w-full h-full opacity-80"
      >
        <defs>
          <linearGradient id={`wave-grad-${theme}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradients.start} />
            <stop offset="50%" stopColor={gradients.end} />
            <stop offset="100%" stopColor={gradients.start} />
          </linearGradient>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Back wave */}
        <path
          d={getPath(0, 0.6, 0.8)}
          fill="none"
          stroke={`url(#wave-grad-${theme})`}
          strokeWidth="0.5"
          className="opacity-30"
        />

        {/* Middle wave */}
        <path
          d={getPath(Math.PI / 2, 0.8, 1.1)}
          fill="none"
          stroke={`url(#wave-grad-${theme})`}
          strokeWidth="0.75"
          className="opacity-50"
        />

        {/* Main front glowing wave */}
        <path
          d={getPath(Math.PI, 1.1, 1.3)}
          fill="none"
          stroke={`url(#wave-grad-${theme})`}
          strokeWidth="1.25"
          filter="url(#glow-filter)"
          className="opacity-90"
        />
      </svg>

      {/* Grid scanning effect to enhance the amazing graphics */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
    </div>
  );
}
