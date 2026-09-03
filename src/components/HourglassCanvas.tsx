import React, { useEffect, useRef } from 'react';
import { ThemeColors } from '../types/theme';

interface HourglassCanvasProps {
  progressPercent: number; // 0 to 100 (elapsed)
  remainingPercent: number; // 100 to 0 (remaining)
  isExpired: boolean;
  theme: ThemeColors;
}

interface Grain {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  color: string;
  alpha: number;
}

export const HourglassCanvas: React.FC<HourglassCanvasProps> = ({
  progressPercent,
  remainingPercent,
  isExpired,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const grainsRef = useRef<Grain[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const setupDpi = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    setupDpi();
    window.addEventListener('resize', setupDpi);

    const colors = theme.sandGrains;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      
      // Geometry calculations
      const totalH = Math.min(height * 0.88, 220);
      const halfH = totalH / 2;
      const topY = cy - halfH;
      const bottomY = cy + halfH;
      
      const bulbW = Math.min(width * 0.45, 85);
      const neckW = 10;
      const neckH = 14;

      // 1. Draw Hourglass Stand & Wooden/Metallic End Caps
      ctx.save();
      const capW = bulbW * 1.25;
      const capH = 8;
      const capRadius = 4;

      // Top Cap
      ctx.fillStyle = theme.accent;
      ctx.shadowColor = theme.accentGlow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(cx - capW / 2, topY - capH, capW, capH, capRadius);
      ctx.fill();

      // Bottom Cap
      ctx.beginPath();
      ctx.roundRect(cx - capW / 2, bottomY, capW, capH, capRadius);
      ctx.fill();

      // Delicate Side Supporting Columns
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.border;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(cx - capW / 2 + 4, topY);
      ctx.lineTo(cx - capW / 2 + 4, bottomY);
      ctx.moveTo(cx + capW / 2 - 4, topY);
      ctx.lineTo(cx + capW / 2 - 4, bottomY);
      ctx.stroke();
      ctx.restore();

      // Helper function to trace upper chamber inner glass wall
      const traceTopChamber = () => {
        ctx.beginPath();
        ctx.moveTo(cx - bulbW, topY);
        ctx.lineTo(cx + bulbW, topY);
        ctx.bezierCurveTo(
          cx + bulbW * 0.95, cy - neckH * 2.5,
          cx + neckW * 1.4, cy - neckH * 0.6,
          cx + neckW / 2, cy
        );
        ctx.lineTo(cx - neckW / 2, cy);
        ctx.bezierCurveTo(
          cx - neckW * 1.4, cy - neckH * 0.6,
          cx - bulbW * 0.95, cy - neckH * 2.5,
          cx - bulbW, topY
        );
        ctx.closePath();
      };

      // Helper function to trace lower chamber inner glass wall
      const traceBottomChamber = () => {
        ctx.beginPath();
        ctx.moveTo(cx - neckW / 2, cy);
        ctx.lineTo(cx + neckW / 2, cy);
        ctx.bezierCurveTo(
          cx + neckW * 1.4, cy + neckH * 0.6,
          cx + bulbW * 0.95, cy + neckH * 2.5,
          cx + bulbW, bottomY
        );
        ctx.lineTo(cx - bulbW, bottomY);
        ctx.bezierCurveTo(
          cx - bulbW * 0.95, cy + neckH * 2.5,
          cx - neckW * 1.4, cy + neckH * 0.6,
          cx - neckW / 2, cy
        );
        ctx.closePath();
      };

      // 2. Inner Glass Ambient Volume Glow
      ctx.save();
      traceTopChamber();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fill();
      traceBottomChamber();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fill();
      ctx.restore();

      // 3. UPPER CHAMBER SAND (Clipped to inner glass — zero leaking or gaps!)
      if (!isExpired && remainingPercent > 0.05) {
        ctx.save();
        traceTopChamber();
        ctx.clip(); // CLIPS TO EXACT GLASS CONTOUR!

        const topRatio = remainingPercent / 100;
        const availableHeight = halfH - neckH;
        const sandH = availableHeight * topRatio;
        const sandSurfaceY = cy - neckH - sandH;

        const sandGrad = ctx.createLinearGradient(cx, sandSurfaceY, cx, cy);
        sandGrad.addColorStop(0, colors[0]);
        sandGrad.addColorStop(0.7, colors[1] || colors[0]);
        sandGrad.addColorStop(1, colors[2] || colors[0]);

        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        // Funnel-shaped surface dipping slightly in the center
        ctx.moveTo(cx - bulbW * 1.2, sandSurfaceY);
        ctx.quadraticCurveTo(cx, sandSurfaceY + 5, cx + bulbW * 1.2, sandSurfaceY);
        ctx.lineTo(cx + bulbW * 1.2, cy);
        ctx.lineTo(cx - bulbW * 1.2, cy);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 4. LOWER CHAMBER ACCUMULATING DUNE (Clipped to lower glass!)
      ctx.save();
      traceBottomChamber();
      ctx.clip(); // CLIPS TO LOWER GLASS CONTOUR!

      const botRatio = Math.min(1, progressPercent / 100);
      if (botRatio > 0.005) {
        const availableHeight = halfH - neckH;
        const duneH = availableHeight * Math.pow(botRatio, 0.82);
        const dunePeakY = bottomY - duneH;

        const duneGrad = ctx.createLinearGradient(cx, dunePeakY, cx, bottomY);
        duneGrad.addColorStop(0, colors[0]);
        duneGrad.addColorStop(0.5, colors[1] || colors[0]);
        duneGrad.addColorStop(1, colors[2] || colors[0]);

        ctx.fillStyle = duneGrad;
        ctx.beginPath();
        // Natural parabolic sand mound with crest at center
        ctx.moveTo(cx - bulbW * 1.2, bottomY);
        ctx.quadraticCurveTo(cx - bulbW * 0.35, dunePeakY + 2, cx, dunePeakY);
        ctx.quadraticCurveTo(cx + bulbW * 0.35, dunePeakY + 2, cx + bulbW * 1.2, bottomY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 5. STREAM & FALLING SAND GRAINS
      const dunePeakY = bottomY - (halfH - neckH) * Math.pow(Math.min(1, progressPercent / 100), 0.82);
      if (!isExpired && remainingPercent > 0.1) {
        // Continuous central thread
        ctx.save();
        ctx.strokeStyle = theme.sandStream;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = theme.sandGlow;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 2);
        ctx.lineTo(cx, Math.min(bottomY, dunePeakY + 2));
        ctx.stroke();
        ctx.restore();

        // Spawn falling grains
        if (grainsRef.current.length < 30) {
          for (let i = 0; i < 2; i++) {
            grainsRef.current.push({
              x: cx + (Math.random() - 0.5) * 3,
              y: cy + Math.random() * 4,
              vx: (Math.random() - 0.5) * 0.8,
              vy: 2.8 + Math.random() * 3.2,
              size: 1.2 + Math.random() * 1.4,
              color: colors[Math.floor(Math.random() * colors.length)],
              alpha: 0.8 + Math.random() * 0.2
            });
          }
        }
      }

      // Render & update grains
      ctx.save();
      const nextGrains: Grain[] = [];
      for (const g of grainsRef.current) {
        g.y += g.vy;
        g.x += g.vx;
        g.vy += 0.2;

        if (g.y < dunePeakY) {
          ctx.fillStyle = g.color;
          ctx.globalAlpha = g.alpha;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
          ctx.fill();
          nextGrains.push(g);
        }
      }
      grainsRef.current = nextGrains;
      ctx.restore();

      // 6. CRISP OUTER GLASS SILHOUETTE (Drawn ON TOP for crystal sharpness)
      ctx.save();
      ctx.strokeStyle = theme.glassBorder;
      ctx.lineWidth = 2;
      ctx.shadowColor = theme.accentGlow;
      ctx.shadowBlur = 4;

      traceTopChamber();
      ctx.stroke();

      traceBottomChamber();
      ctx.stroke();

      // Delicate inner glass highlights
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Upper left glass reflection
      ctx.moveTo(cx - bulbW + 4, topY + 4);
      ctx.bezierCurveTo(
        cx - bulbW * 0.9, cy - neckH * 2.2,
        cx - neckW * 1.5, cy - neckH * 0.8,
        cx - neckW / 2, cy - 2
      );
      // Lower right glass reflection
      ctx.moveTo(cx + neckW / 2, cy + 2);
      ctx.bezierCurveTo(
        cx + neckW * 1.5, cy + neckH * 0.8,
        cx + bulbW * 0.9, cy + neckH * 2.2,
        cx + bulbW - 4, bottomY - 4
      );
      ctx.stroke();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setupDpi);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [progressPercent, remainingPercent, isExpired, theme]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-xs h-48 sm:h-56 md:h-60 flex items-center justify-center my-1 flex-shrink-0"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};
