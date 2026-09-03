import React, { useEffect, useRef } from "react";

interface ThreeBackgroundProps {
  isDarkMode: boolean;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse coordinates with easing
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Generate 3D Grid Wave Matrix Points
    const rows = 28;
    const cols = 42;
    const points: Array<{ x: number; y: number; z: number; baseZ: number; colorType: number }> = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Distribute colors: 0=Green(profit), 1=Blue(institutional), 2=Orange(catalyst), 3=Red(risk)
        const colorType = (r * cols + c) % 4;
        points.push({
          x: (c / (cols - 1) - 0.5) * 2200,
          y: (r / (rows - 1) - 0.5) * 1400 + 200,
          z: (Math.sin(c * 0.3) + Math.cos(r * 0.3)) * 60,
          baseZ: (Math.sin(c * 0.3) + Math.cos(r * 0.3)) * 60,
          colorType,
        });
      }
    }

    let time = 0;

    const render = () => {
      time += 0.02;

      // Mouse smooth interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Camera 3D perspective variables
      const fov = 450;
      const cameraX = (mouseX - width / 2) * 0.3;
      const cameraY = (mouseY - height / 2) * 0.2 - 150;
      const cameraZ = -300;

      // Draw 3D Wave lines & nodes
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        let firstDrawn = false;

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const p = points[idx];

          // Dynamic wave oscillation
          const wave = Math.sin(time + c * 0.2 + r * 0.15) * 45;
          const currentZ = p.baseZ + wave;

          // 3D to 2D projection
          const relX = p.x - cameraX;
          const relY = p.y - cameraY;
          const relZ = currentZ - cameraZ;

          if (relZ <= 0) continue;

          const scale = fov / relZ;
          const projX = width / 2 + relX * scale;
          const projY = height / 2 + relY * scale;

          if (projX < -100 || projX > width + 100 || projY < -100 || projY > height + 100) {
            continue;
          }

          if (!firstDrawn) {
            ctx.moveTo(projX, projY);
            firstDrawn = true;
          } else {
            ctx.lineTo(projX, projY);
          }

          // Render glowing 3D node points
          const nodeRadius = Math.max(0.8, scale * (isDarkMode ? 2.2 : 1.6));
          ctx.save();
          ctx.beginPath();
          ctx.arc(projX, projY, nodeRadius, 0, Math.PI * 2);

          if (isDarkMode) {
            if (p.colorType === 0) ctx.fillStyle = "rgba(16, 185, 129, 0.65)"; // Emerald
            else if (p.colorType === 1) ctx.fillStyle = "rgba(99, 102, 241, 0.65)"; // Blue
            else if (p.colorType === 2) ctx.fillStyle = "rgba(245, 158, 11, 0.65)"; // Orange
            else ctx.fillStyle = "rgba(244, 63, 94, 0.55)"; // Rose Red
            ctx.shadowBlur = 8;
            ctx.shadowColor = ctx.fillStyle as string;
          } else {
            if (p.colorType === 0) ctx.fillStyle = "rgba(16, 185, 129, 0.35)";
            else if (p.colorType === 1) ctx.fillStyle = "rgba(99, 102, 241, 0.35)";
            else if (p.colorType === 2) ctx.fillStyle = "rgba(245, 158, 11, 0.35)";
            else ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
          }

          ctx.fill();
          ctx.restore();
        }

        // Draw connecting matrix line
        if (isDarkMode) {
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 + (r / rows) * 0.08})`;
          ctx.lineWidth = 0.75;
        } else {
          ctx.strokeStyle = `rgba(148, 163, 184, ${0.12 + (r / rows) * 0.1})`;
          ctx.lineWidth = 0.6;
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 3D WebGL / Canvas wave matrix */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block opacity-90 transition-opacity duration-700"
      />

      {/* Vibrant Ambient Glow Color Meshes */}
      <div
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[130px] transition-all duration-700 ${
          isDarkMode
            ? "bg-indigo-600/15"
            : "bg-indigo-400/15"
        }`}
      />
      <div
        className={`absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full blur-[140px] transition-all duration-700 ${
          isDarkMode
            ? "bg-emerald-600/15"
            : "bg-emerald-300/20"
        }`}
      />
      <div
        className={`absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] transition-all duration-700 ${
          isDarkMode
            ? "bg-amber-600/12"
            : "bg-amber-300/15"
        }`}
      />
      <div
        className={`absolute -bottom-32 right-1/4 w-[550px] h-[550px] rounded-full blur-[140px] transition-all duration-700 ${
          isDarkMode
            ? "bg-rose-600/12"
            : "bg-rose-300/15"
        }`}
      />
    </div>
  );
};
