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
    const rows = 26;
    const cols = 38;
    const points: Array<{ x: number; y: number; z: number; baseZ: number; colorType: number }> = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Distribute colors: 0=Soft Emerald, 1=Warm Champagne Gold, 2=Honey Amber, 3=Soft Coral
        const colorType = (r * cols + c) % 4;
        points.push({
          x: (c / (cols - 1) - 0.5) * 2200,
          y: (r / (rows - 1) - 0.5) * 1400 + 200,
          z: (Math.sin(c * 0.3) + Math.cos(r * 0.3)) * 45,
          baseZ: (Math.sin(c * 0.3) + Math.cos(r * 0.3)) * 45,
          colorType,
        });
      }
    }

    let time = 0;

    const render = () => {
      time += 0.015;

      // Mouse smooth interpolation
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      ctx.clearRect(0, 0, width, height);

      // Camera 3D perspective variables
      const fov = 460;
      const cameraX = (mouseX - width / 2) * 0.22;
      const cameraY = (mouseY - height / 2) * 0.16 - 130;
      const cameraZ = -300;

      // Draw 3D Wave lines & soothing non-blue nodes
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        let firstDrawn = false;

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const p = points[idx];

          // Dynamic gentle wave oscillation
          const wave = Math.sin(time + c * 0.18 + r * 0.12) * 30;
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

          // Render soft, soothing non-blue 3D node points
          const nodeRadius = Math.max(0.7, scale * (isDarkMode ? 1.4 : 1.2));
          ctx.save();
          ctx.beginPath();
          ctx.arc(projX, projY, nodeRadius, 0, Math.PI * 2);

          if (isDarkMode) {
            // Warm non-blue palette: Emerald, Champagne Gold, Honey Amber, Soft Coral
            if (p.colorType === 0) ctx.fillStyle = "rgba(52, 211, 153, 0.35)"; // Sage Emerald
            else if (p.colorType === 1) ctx.fillStyle = "rgba(234, 179, 8, 0.32)"; // Warm Champagne Gold
            else if (p.colorType === 2) ctx.fillStyle = "rgba(245, 158, 11, 0.30)"; // Honey Amber
            else ctx.fillStyle = "rgba(251, 113, 133, 0.25)"; // Soft Coral
          } else {
            if (p.colorType === 0) ctx.fillStyle = "rgba(16, 185, 129, 0.30)";
            else if (p.colorType === 1) ctx.fillStyle = "rgba(217, 119, 6, 0.28)";
            else if (p.colorType === 2) ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
            else ctx.fillStyle = "rgba(244, 63, 94, 0.20)";
          }

          ctx.fill();
          ctx.restore();
        }

        // Connecting matrix line (Subtle warm charcoal)
        if (isDarkMode) {
          ctx.strokeStyle = `rgba(156, 163, 175, ${0.03 + (r / rows) * 0.04})`;
          ctx.lineWidth = 0.55;
        } else {
          ctx.strokeStyle = `rgba(148, 163, 184, ${0.08 + (r / rows) * 0.08})`;
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      }

      if (!document.hidden) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        cancelAnimationFrame(animationFrameId);
        render();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 3D WebGL / Canvas wave matrix */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block opacity-85 transition-opacity duration-700"
      />

      {/* Warm Ambient Glow Meshes (Zero blue light, soft emerald & gold) */}
      <div
        className={`absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[170px] transition-all duration-700 pointer-events-none ${
          isDarkMode
            ? "bg-emerald-950/20"
            : "bg-emerald-200/15"
        }`}
      />
      <div
        className={`absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full blur-[170px] transition-all duration-700 pointer-events-none ${
          isDarkMode
            ? "bg-amber-950/20"
            : "bg-amber-200/15"
        }`}
      />
      <div
        className={`absolute bottom-10 left-1/4 w-[500px] h-[500px] rounded-full blur-[170px] transition-all duration-700 pointer-events-none ${
          isDarkMode
            ? "bg-yellow-950/15"
            : "bg-yellow-100/15"
        }`}
      />
      <div
        className={`absolute -bottom-32 right-1/4 w-[550px] h-[550px] rounded-full blur-[170px] transition-all duration-700 pointer-events-none ${
          isDarkMode
            ? "bg-rose-950/12"
            : "bg-rose-100/15"
        }`}
      />
    </div>
  );
};
