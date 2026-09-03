import React, { useEffect, useRef } from 'react';
import { ThemeColors } from '../types/theme';

interface HourglassCanvasProps {
  progressPercent: number;
  remainingPercent: number;
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

  // Keep latest props in a ref so the 60 FPS requestAnimationFrame loop never re-initializes on state changes
  const propsRef = useRef({ progressPercent, remainingPercent, isExpired, theme });
  useEffect(() => {
    propsRef.current = { progressPercent, remainingPercent, isExpired, theme };
  }, [progressPercent, remainingPercent, isExpired, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', { alpha: true });
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

    const render = () => {
      const { progressPercent: prog, remainingPercent: rem, isExpired: exp, theme: currentTheme } = propsRef.current;
      const colors = currentTheme.sandGrains;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Frame bounds
      const totalH = Math.min(height * 0.88, 220);
      const halfH = totalH / 2;
      const topY = cy - halfH;
      const bottomY = cy + halfH;

      const bulbW = Math.min(width * 0.45, 85);
      const neckW = 10;
      const neckH = 14;

      // 1. Stand & End Caps (Seamlessly covering top and bottom rims)
      ctx.save();
      const capW = bulbW * 2 + 8;
      const capH = 8;
      const capRadius = 4;

      // Top Cap
      ctx.fillStyle = currentTheme.accent;
      ctx.shadowColor = currentTheme.accentGlow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(cx - capW / 2, topY - capH, capW, capH, capRadius);
      ctx.fill();

      // Bottom Cap
      ctx.beginPath();
      ctx.roundRect(cx - capW / 2, bottomY, capW, capH, capRadius);
      ctx.fill();
      ctx.restore();

      // Path traces
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

      // 2. Glass Volume Ambient Sheen
      ctx.save();
      traceTopChamber();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fill();
      traceBottomChamber();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fill();
      ctx.restore();

      // 3. Upper Chamber Sand (Clipped to inner glass)
      if (!exp && rem > 0.05) {
        ctx.save();
        traceTopChamber();
        ctx.clip();

        const topRatio = rem / 100;
        const availableHeight = halfH - neckH;
        const sandH = availableHeight * topRatio;
        const sandSurfaceY = cy - neckH - sandH;

        const sandGrad = ctx.createLinearGradient(cx, sandSurfaceY, cx, cy);
        sandGrad.addColorStop(0, colors[0]);
        sandGrad.addColorStop(0.7, colors[1] || colors[0]);
        sandGrad.addColorStop(1, colors[2] || colors[0]);

        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        ctx.moveTo(cx - bulbW * 1.2, sandSurfaceY);
        ctx.quadraticCurveTo(cx, sandSurfaceY + 5, cx + bulbW * 1.2, sandSurfaceY);
        ctx.lineTo(cx + bulbW * 1.2, cy);
        ctx.lineTo(cx - bulbW * 1.2, cy);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 4. Lower Chamber Dune (Clipped to lower glass)
      ctx.save();
      traceBottomChamber();
      ctx.clip();

      const botRatio = Math.min(1, prog / 100);
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
        ctx.moveTo(cx - bulbW * 1.2, bottomY);
        ctx.quadraticCurveTo(cx - bulbW * 0.35, dunePeakY + 2, cx, dunePeakY);
        ctx.quadraticCurveTo(cx + bulbW * 0.35, dunePeakY + 2, cx + bulbW * 1.2, bottomY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 5. Sand Stream & Falling Particles
      const dunePeakY = bottomY - (halfH - neckH) * Math.pow(Math.min(1, prog / 100), 0.82);
      if (!exp && rem > 0.1) {
        ctx.save();
        ctx.strokeStyle = currentTheme.sandStream;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = currentTheme.sandGlow;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 2);
        ctx.lineTo(cx, Math.min(bottomY, dunePeakY + 2));
        ctx.stroke();
        ctx.restore();

        // Spawn falling grains (capped to 30 particles max for ultra-low frame budget)
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

      // Update falling grains
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

      // 6. Crisp Outer Glass Walls (Curved left and right silhouettes only)
      ctx.save();
      ctx.strokeStyle = currentTheme.glassBorder;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = currentTheme.accentGlow;
      ctx.shadowBlur = 4;

      ctx.beginPath();
      // Left glass wall from top to bottom
      ctx.moveTo(cx - bulbW, topY);
      ctx.bezierCurveTo(
        cx - bulbW * 0.95, cy - neckH * 2.5,
        cx - neckW * 1.4, cy - neckH * 0.6,
        cx - neckW / 2, cy
      );
      ctx.bezierCurveTo(
        cx - neckW * 1.4, cy + neckH * 0.6,
        cx - bulbW * 0.95, cy + neckH * 2.5,
        cx - bulbW, bottomY
      );

      // Right glass wall from top to bottom
      ctx.moveTo(cx + bulbW, topY);
      ctx.bezierCurveTo(
        cx + bulbW * 0.95, cy - neckH * 2.5,
        cx + neckW * 1.4, cy - neckH * 0.6,
        cx + neckW / 2, cy
      );
      ctx.bezierCurveTo(
        cx + neckW * 1.4, cy + neckH * 0.6,
        cx + bulbW * 0.95, cy + neckH * 2.5,
        cx + bulbW, bottomY
      );
      ctx.stroke();
      ctx.restore();

      // Loop at 60 FPS
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', setupDpi);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, []); // Only runs once on mount, reading live state from propsRef!

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-xs h-48 sm:h-56 md:h-60 flex items-center justify-center my-1 flex-shrink-0"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};
