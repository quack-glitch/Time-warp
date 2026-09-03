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
  vx: number;
  vy: number;
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

      const centerX = width / 2;
      const centerY = height / 2;
      // Responsive bulb sizing that scales with container
      const bulbRadius = Math.min(width * 0.35, height * 0.28);
      const neckWidth = Math.max(8, bulbRadius * 0.12);

      const topBulbCenterY = centerY - bulbRadius * 0.85;
      const bottomBulbCenterY = centerY + bulbRadius * 0.85;

      // 1. Draw Hourglass Outer Silhouette (Crisp, Crystal Edge)
      ctx.save();
      ctx.strokeStyle = theme.glassBorder;
      ctx.lineWidth = 2;
      ctx.shadowColor = theme.accentGlow;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      // Top base cap
      const baseHalfWidth = bulbRadius * 1.12;
      ctx.moveTo(centerX - baseHalfWidth, topBulbCenterY - bulbRadius * 0.95);
      ctx.lineTo(centerX + baseHalfWidth, topBulbCenterY - bulbRadius * 0.95);

      // Upper right bulb curve to neck
      ctx.bezierCurveTo(
        centerX + bulbRadius * 1.2, topBulbCenterY - bulbRadius * 0.2,
        centerX + neckWidth * 1.6, centerY - 16,
        centerX + neckWidth / 2, centerY
      );

      // Lower right bulb curve out to base
      ctx.bezierCurveTo(
        centerX + neckWidth * 1.6, centerY + 16,
        centerX + bulbRadius * 1.2, bottomBulbCenterY + bulbRadius * 0.2,
        centerX + baseHalfWidth, bottomBulbCenterY + bulbRadius * 0.95
      );

      // Bottom base cap
      ctx.lineTo(centerX - baseHalfWidth, bottomBulbCenterY + bulbRadius * 0.95);

      // Lower left bulb curve to neck
      ctx.bezierCurveTo(
        centerX - bulbRadius * 1.2, bottomBulbCenterY + bulbRadius * 0.2,
        centerX - neckWidth * 1.6, centerY + 16,
        centerX - neckWidth / 2, centerY
      );

      // Upper left bulb curve to top base
      ctx.bezierCurveTo(
        centerX - neckWidth * 1.6, centerY - 16,
        centerX - bulbRadius * 1.2, topBulbCenterY - bulbRadius * 0.2,
        centerX - baseHalfWidth, topBulbCenterY - bulbRadius * 0.95
      );

      ctx.stroke();

      // Delicate horizontal frame rings
      ctx.lineWidth = 3;
      ctx.strokeStyle = theme.accent;
      ctx.beginPath();
      ctx.moveTo(centerX - baseHalfWidth * 1.05, topBulbCenterY - bulbRadius * 0.95);
      ctx.lineTo(centerX + baseHalfWidth * 1.05, topBulbCenterY - bulbRadius * 0.95);
      ctx.moveTo(centerX - baseHalfWidth * 1.05, bottomBulbCenterY + bulbRadius * 0.95);
      ctx.lineTo(centerX + baseHalfWidth * 1.05, bottomBulbCenterY + bulbRadius * 0.95);
      ctx.stroke();

      // Glass specular highlight on left rim
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(centerX, topBulbCenterY, bulbRadius * 1.05, Math.PI * 0.85, Math.PI * 1.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, bottomBulbCenterY, bulbRadius * 1.05, Math.PI * 0.85, Math.PI * 1.15);
      ctx.stroke();
      ctx.restore();

      // 2. Upper Chamber Sand (Remaining Time)
      if (!isExpired && remainingPercent > 0.5) {
        ctx.save();
        const topFillRatio = remainingPercent / 100;
        const topSandHeight = bulbRadius * 1.45 * topFillRatio;
        const topSandY = centerY - 8 - topSandHeight;

        const sandGrad = ctx.createLinearGradient(centerX, topSandY, centerX, centerY);
        sandGrad.addColorStop(0, colors[0]);
        sandGrad.addColorStop(1, colors[2] || colors[0]);

        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        const currentTopWidth = (bulbRadius * 0.9) * Math.sqrt(topFillRatio);
        // Curved sand surface (meniscus)
        ctx.moveTo(centerX - currentTopWidth, topSandY);
        ctx.quadraticCurveTo(centerX, topSandY + 3, centerX + currentTopWidth, topSandY);
        ctx.bezierCurveTo(
          centerX + currentTopWidth * 0.45, centerY - 20,
          centerX + neckWidth * 0.8, centerY - 6,
          centerX, centerY - 2
        );
        ctx.bezierCurveTo(
          centerX - neckWidth * 0.8, centerY - 6,
          centerX - currentTopWidth * 0.45, centerY - 20,
          centerX - currentTopWidth, topSandY
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 3. Lower Chamber Sand Dune (Elapsed Time)
      ctx.save();
      const bottomFillRatio = Math.min(1, progressPercent / 100);
      const bottomDuneMaxHeight = bulbRadius * 1.4;
      const bottomDuneHeight = bottomDuneMaxHeight * Math.pow(bottomFillRatio, 0.85);
      const duneBaseY = bottomBulbCenterY + bulbRadius * 0.93;
      const dunePeakY = duneBaseY - bottomDuneHeight;

      if (bottomFillRatio > 0.01) {
        const duneGrad = ctx.createLinearGradient(centerX, dunePeakY, centerX, duneBaseY);
        duneGrad.addColorStop(0, colors[0]);
        duneGrad.addColorStop(1, colors[1] || colors[0]);

        ctx.fillStyle = duneGrad;
        ctx.beginPath();
        const duneBaseWidth = bulbRadius * 1.0;
        ctx.moveTo(centerX - duneBaseWidth, duneBaseY);
        // Graceful parabolic sand mound
        ctx.quadraticCurveTo(centerX - duneBaseWidth * 0.25, dunePeakY + 2, centerX, dunePeakY);
        ctx.quadraticCurveTo(centerX + duneBaseWidth * 0.25, dunePeakY + 2, centerX + duneBaseWidth, duneBaseY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 4. Center Falling Stream & Grains
      if (!isExpired && remainingPercent > 0.1) {
        ctx.save();
        ctx.strokeStyle = theme.sandStream;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = theme.sandGlow;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 2);
        ctx.lineTo(centerX, dunePeakY + 2);
        ctx.stroke();
        ctx.restore();

        // Spawn falling grains
        if (grainsRef.current.length < 35) {
          for (let i = 0; i < 2; i++) {
            grainsRef.current.push({
              x: centerX + (Math.random() - 0.5) * 4,
              y: centerY + Math.random() * 6,
              vx: (Math.random() - 0.5) * 1.0,
              vy: 2.5 + Math.random() * 3.5,
              size: 1.2 + Math.random() * 1.6,
              color: colors[Math.floor(Math.random() * colors.length)],
              alpha: 0.8 + Math.random() * 0.2
            });
          }
        }
      }

      // Render falling grains
      ctx.save();
      const nextGrains: Grain[] = [];
      for (const g of grainsRef.current) {
        g.y += g.vy;
        g.x += g.vx;
        g.vy += 0.22;

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
      className="relative w-full max-w-sm h-52 sm:h-60 md:h-64 flex items-center justify-center my-1 sm:my-2 flex-shrink-0"
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};
