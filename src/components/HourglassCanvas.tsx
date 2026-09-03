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
  const grainsRef = useRef<Grain[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 420);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 480);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = theme.sandGrains;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const bulbRadius = Math.min(width, height) * 0.26;
      const neckWidth = 14;

      const topBulbCenterY = centerY - bulbRadius * 0.85;
      const bottomBulbCenterY = centerY + bulbRadius * 0.85;

      // 1. Draw Hourglass Silhouette
      ctx.save();
      ctx.strokeStyle = theme.glassBorder;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = theme.accentGlow;
      ctx.shadowBlur = 18;

      // Left glass curvature
      ctx.beginPath();
      // Top base
      ctx.moveTo(centerX - bulbRadius * 1.15, topBulbCenterY - bulbRadius * 0.95);
      ctx.lineTo(centerX + bulbRadius * 1.15, topBulbCenterY - bulbRadius * 0.95);

      // Upper right bulb curve down to neck
      ctx.bezierCurveTo(
        centerX + bulbRadius * 1.25, topBulbCenterY - bulbRadius * 0.3,
        centerX + neckWidth * 1.5, centerY - 24,
        centerX + neckWidth / 2, centerY
      );

      // Lower right bulb curve out to base
      ctx.bezierCurveTo(
        centerX + neckWidth * 1.5, centerY + 24,
        centerX + bulbRadius * 1.25, bottomBulbCenterY + bulbRadius * 0.3,
        centerX + bulbRadius * 1.15, bottomBulbCenterY + bulbRadius * 0.95
      );

      // Bottom base
      ctx.lineTo(centerX - bulbRadius * 1.15, bottomBulbCenterY + bulbRadius * 0.95);

      // Lower left bulb curve up to neck
      ctx.bezierCurveTo(
        centerX - bulbRadius * 1.25, bottomBulbCenterY + bulbRadius * 0.3,
        centerX - neckWidth * 1.5, centerY + 24,
        centerX - neckWidth / 2, centerY
      );

      // Upper left bulb curve up to top base
      ctx.bezierCurveTo(
        centerX - neckWidth * 1.5, centerY - 24,
        centerX - bulbRadius * 1.25, topBulbCenterY - bulbRadius * 0.3,
        centerX - bulbRadius * 1.15, topBulbCenterY - bulbRadius * 0.95
      );

      ctx.stroke();

      // Delicate horizontal caps
      ctx.lineWidth = 4;
      ctx.strokeStyle = theme.accent;
      ctx.beginPath();
      ctx.moveTo(centerX - bulbRadius * 1.25, topBulbCenterY - bulbRadius * 0.95);
      ctx.lineTo(centerX + bulbRadius * 1.25, topBulbCenterY - bulbRadius * 0.95);
      ctx.moveTo(centerX - bulbRadius * 1.25, bottomBulbCenterY + bulbRadius * 0.95);
      ctx.lineTo(centerX + bulbRadius * 1.25, bottomBulbCenterY + bulbRadius * 0.95);
      ctx.stroke();
      ctx.restore();

      // 2. Upper Chamber Sand (Remaining Time)
      if (!isExpired && remainingPercent > 0.5) {
        ctx.save();
        const topFillRatio = remainingPercent / 100;
        const topSandHeight = bulbRadius * 1.5 * topFillRatio;
        const topSandY = centerY - 14 - topSandHeight;

        const sandGrad = ctx.createLinearGradient(centerX, topSandY, centerX, centerY);
        sandGrad.addColorStop(0, colors[0]);
        sandGrad.addColorStop(1, colors[2] || colors[0]);

        ctx.fillStyle = sandGrad;
        ctx.beginPath();
        // Funnel shape
        const currentTopWidth = (bulbRadius * 0.95) * Math.sqrt(topFillRatio);
        ctx.moveTo(centerX - currentTopWidth, topSandY);
        ctx.lineTo(centerX + currentTopWidth, topSandY);
        ctx.bezierCurveTo(
          centerX + currentTopWidth * 0.5, centerY - 30,
          centerX + neckWidth * 0.8, centerY - 10,
          centerX, centerY - 4
        );
        ctx.bezierCurveTo(
          centerX - neckWidth * 0.8, centerY - 10,
          centerX - currentTopWidth * 0.5, centerY - 30,
          centerX - currentTopWidth, topSandY
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 3. Lower Chamber Sand Dune (Elapsed Time)
      ctx.save();
      const bottomFillRatio = Math.min(1, progressPercent / 100);
      const bottomDuneMaxHeight = bulbRadius * 1.45;
      const bottomDuneHeight = bottomDuneMaxHeight * Math.pow(bottomFillRatio, 0.85);
      const duneBaseY = bottomBulbCenterY + bulbRadius * 0.93;
      const dunePeakY = duneBaseY - bottomDuneHeight;

      if (bottomFillRatio > 0.01) {
        const duneGrad = ctx.createLinearGradient(centerX, dunePeakY, centerX, duneBaseY);
        duneGrad.addColorStop(0, colors[0]);
        duneGrad.addColorStop(1, colors[1] || colors[0]);

        ctx.fillStyle = duneGrad;
        ctx.beginPath();
        const duneBaseWidth = bulbRadius * 1.05;
        ctx.moveTo(centerX - duneBaseWidth, duneBaseY);
        // Mound curve with peak at center
        ctx.quadraticCurveTo(centerX - duneBaseWidth * 0.25, dunePeakY + 4, centerX, dunePeakY);
        ctx.quadraticCurveTo(centerX + duneBaseWidth * 0.25, dunePeakY + 4, centerX + duneBaseWidth, duneBaseY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 4. Neck Stream & Falling Grains (Continuous Visual Motion)
      if (!isExpired && remainingPercent > 0.1) {
        // Dynamic continuous stream line
        ctx.save();
        ctx.strokeStyle = theme.sandStream;
        ctx.lineWidth = 3;
        ctx.shadowColor = theme.sandGlow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 2);
        ctx.lineTo(centerX, dunePeakY + 2);
        ctx.stroke();
        ctx.restore();

        // Spawn falling grains
        if (grainsRef.current.length < 45) {
          for (let i = 0; i < 3; i++) {
            grainsRef.current.push({
              x: centerX + (Math.random() - 0.5) * 5,
              y: centerY + Math.random() * 8,
              vx: (Math.random() - 0.5) * 1.2,
              vy: 3 + Math.random() * 4,
              size: 1.5 + Math.random() * 2,
              color: colors[Math.floor(Math.random() * colors.length)],
              alpha: 0.7 + Math.random() * 0.3
            });
          }
        }
      }

      // Update & render active grains
      ctx.save();
      const nextGrains: Grain[] = [];
      for (const g of grainsRef.current) {
        g.y += g.vy;
        g.x += g.vx;
        g.vy += 0.25; // gravity

        // Grains splash when reaching the dune peak
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
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [progressPercent, remainingPercent, isExpired, theme]);

  return (
    <div className="relative w-full h-72 sm:h-96 flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
