import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface ParticlesCanvasHandle {
  triggerBurst: (x: number, y: number, color: string) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  decay: number;
  gravity: number;
  type: 'circle' | 'star' | 'ring';
  maxRadius?: number; // For rings
}

export const ParticlesCanvas = forwardRef<ParticlesCanvasHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleIdCounter = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

    const render = () => {
      // Clear canvas with a very slight transparency for beautiful motion trails
      ctx.fillStyle = 'rgba(10, 10, 12, 0.15)';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply physics
        p.vy += p.gravity;
        p.vx *= 0.98; // Friction
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= p.decay;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;

        // Custom particle rendering for "amazing graphics"
        if (p.type === 'circle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          // Glow effect
          ctx.shadowBlur = p.radius * 2;
          ctx.shadowColor = p.color;
          ctx.fill();
        } else if (p.type === 'star') {
          // 4-point star sparkle
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.shadowBlur = p.radius * 2;
          ctx.shadowColor = p.color;
          const r = p.radius * 1.5;
          ctx.moveTo(p.x, p.y - r);
          ctx.lineTo(p.x + r * 0.3, p.y - r * 0.3);
          ctx.lineTo(p.x + r, p.y);
          ctx.lineTo(p.x + r * 0.3, p.y + r * 0.3);
          ctx.lineTo(p.x, p.y + r);
          ctx.lineTo(p.x - r * 0.3, p.y + r * 0.3);
          ctx.lineTo(p.x - r, p.y);
          ctx.lineTo(p.x - r * 0.3, p.y - r * 0.3);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'ring') {
          // Expanding hollow ring
          ctx.beginPath();
          p.radius += 0.8; // Expand rings faster
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = p.radius * 0.5;
          ctx.shadowColor = p.color;
          ctx.stroke();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    triggerBurst: (x: number, y: number, color: string) => {
      const count = 16 + Math.floor(Math.random() * 10);
      const newParticles: Particle[] = [];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 5.5;
        const radius = 2 + Math.random() * 5;
        
        // Random particle type
        const typeRand = Math.random();
        let type: 'circle' | 'star' | 'ring' = 'circle';
        if (typeRand > 0.85) {
          type = 'ring';
        } else if (typeRand > 0.6) {
          type = 'star';
        }

        newParticles.push({
          id: particleIdCounter.current++,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (1 + Math.random() * 2), // Boost upward slightly
          radius,
          color,
          opacity: 1,
          decay: 0.012 + Math.random() * 0.015,
          gravity: 0.12, // subtle gravity pulling down
          type,
        });
      }

      particlesRef.current.push(...newParticles);
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 block"
      style={{ mixBlendMode: 'screen' }}
      id="particles-canvas"
    />
  );
});

ParticlesCanvas.displayName = 'ParticlesCanvas';
