import React, { useEffect, useRef } from "react";

interface ThreeBackgroundProps {
  isDarkMode: boolean;
}

interface Vertex3D {
  x: number;
  y: number;
  z: number;
}

interface Asteroid3D {
  x: number;
  y: number;
  z: number;
  size: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  speedRotX: number;
  speedRotY: number;
  speedRotZ: number;
  driftZ: number;
  driftX: number;
  driftY: number;
  baseVertices: Vertex3D[];
  transformedVertices: Vertex3D[];
  projectedVertices: { x: number; y: number; visible: boolean }[];
  faces: number[][];
  veinFaces: boolean[];
  colorTone: number; // 0=charcoal/slate, 1=iron/graphite, 2=mineral rich
}

interface StarParticle {
  x: number;
  y: number;
  z: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
}

// Helper to generate a perturbed 3D icosahedron / geodesic sphere for craggy asteroid shape
function createAsteroidMesh(radius: number): { vertices: Vertex3D[]; faces: number[][]; veinFaces: boolean[] } {
  // Golden ratio
  const t = (1.0 + Math.sqrt(5.0)) / 2.0;

  // Base 12 icosahedron vertices
  const rawVerts: Vertex3D[] = [
    { x: -1, y: t, z: 0 },
    { x: 1, y: t, z: 0 },
    { x: -1, y: -t, z: 0 },
    { x: 1, y: -t, z: 0 },
    { x: 0, y: -1, z: t },
    { x: 0, y: 1, z: t },
    { x: 0, y: -1, z: -t },
    { x: 0, y: 1, z: -t },
    { x: t, y: 0, z: -1 },
    { x: t, y: 0, z: 1 },
    { x: -t, y: 0, z: -1 },
    { x: -t, y: 0, z: 1 },
  ];

  // 20 triangular faces
  const rawFaces: number[][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  // Randomize & perturb vertices to create irregular crags and craters
  const vertices: Vertex3D[] = rawVerts.map((v) => {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    // Perturb radius with noise between 0.65 and 1.35
    const crag = 0.65 + Math.random() * 0.70;
    const scale = (radius * crag) / len;
    return {
      x: v.x * scale,
      y: v.y * scale,
      z: v.z * scale,
    };
  });

  // Randomly assign 20-30% of faces to have glowing mineral veins
  const veinFaces: boolean[] = rawFaces.map(() => Math.random() < 0.25);

  return { vertices, faces: rawFaces, veinFaces };
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

    // Mouse coordinates with easing for subtle 3D parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / width - 0.5) * 80;
      targetMouseY = (e.clientY / height - 0.5) * 60;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 1. Generate 3D Asteroid Belt Entities (45 entities)
    const ASTEROID_COUNT = 45;
    const asteroids: Asteroid3D[] = [];

    for (let i = 0; i < ASTEROID_COUNT; i++) {
      const radius = 18 + Math.random() * 32;
      const mesh = createAsteroidMesh(radius);

      asteroids.push({
        x: (Math.random() - 0.5) * 2200,
        y: (Math.random() - 0.5) * 1500,
        z: 350 + Math.random() * 1800,
        size: radius,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        speedRotX: (Math.random() - 0.5) * 0.008,
        speedRotY: (Math.random() - 0.5) * 0.010,
        speedRotZ: (Math.random() - 0.5) * 0.006,
        driftZ: -0.25 - Math.random() * 0.45,
        driftX: (Math.random() - 0.5) * 0.15,
        driftY: (Math.random() - 0.5) * 0.10,
        baseVertices: mesh.vertices,
        transformedVertices: mesh.vertices.map((v) => ({ ...v })),
        projectedVertices: mesh.vertices.map(() => ({ x: 0, y: 0, visible: true })),
        faces: mesh.faces,
        veinFaces: mesh.veinFaces,
        colorTone: Math.floor(Math.random() * 3),
      });
    }

    // 2. Generate Deep Cosmic Stardust Particles (150 stars)
    const STAR_COUNT = 150;
    const stars: StarParticle[] = [];

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2800,
        y: (Math.random() - 0.5) * 1800,
        z: 400 + Math.random() * 2200,
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.2 + Math.random() * 0.6,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
      });
    }

    // Camera Focal Length
    const FOCAL_LENGTH = 650;
    // Directional Light Vector (Normalized Top-Left-Forward: [-0.6, -0.8, 1.0])
    const lightLen = Math.sqrt(0.36 + 0.64 + 1.0);
    const lx = -0.6 / lightLen;
    const ly = -0.8 / lightLen;
    const lz = 1.0 / lightLen;

    // Visibility Management (Battery & Performance Saver)
    let isTabVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      if (!isTabVisible) return;

      const dt = Math.min(currentTime - lastTime, 50);
      lastTime = currentTime;

      // Smooth mouse parallax interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // -------------------------------------------------------------
      // 1. RENDER BACKGROUND COSMIC STARDUST
      // -------------------------------------------------------------
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.z += -0.15;
        if (star.z < 200) star.z = 2400;

        star.alpha += Math.sin(currentTime * star.twinkleSpeed) * 0.015;
        const currentAlpha = Math.max(0.1, Math.min(0.85, star.alpha));

        const scale = FOCAL_LENGTH / star.z;
        const px = (star.x - mouseX * 0.3) * scale + centerX;
        const py = (star.y - mouseY * 0.3) * scale + centerY;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, star.size * scale, 0, Math.PI * 2);
          if (isDarkMode) {
            ctx.fillStyle = `rgba(167, 243, 208, ${currentAlpha * 0.6})`; // subtle cosmic emerald
          } else {
            ctx.fillStyle = `rgba(100, 116, 139, ${currentAlpha * 0.4})`; // soft slate
          }
          ctx.fill();
        }
      }

      // -------------------------------------------------------------
      // 2. TRANSFORM, PROJECT & RENDER 3D ASTEROIDS
      // -------------------------------------------------------------
      // Sort asteroids by depth (Z-Index) so furthest render first
      asteroids.sort((a, b) => b.z - a.z);

      for (let aIdx = 0; aIdx < asteroids.length; aIdx++) {
        const ast = asteroids[aIdx];

        // Update rotations and drift
        ast.rotX += ast.speedRotX * (dt / 16);
        ast.rotY += ast.speedRotY * (dt / 16);
        ast.rotZ += ast.speedRotZ * (dt / 16);

        ast.z += ast.driftZ * (dt / 16);
        ast.x += ast.driftX * (dt / 16);
        ast.y += ast.driftY * (dt / 16);

        // Respawn loop when passes camera
        if (ast.z < 280) {
          ast.z = 2100;
          ast.x = (Math.random() - 0.5) * 2200;
          ast.y = (Math.random() - 0.5) * 1500;
        }

        const sinX = Math.sin(ast.rotX);
        const cosX = Math.cos(ast.rotX);
        const sinY = Math.sin(ast.rotY);
        const cosY = Math.cos(ast.rotY);
        const sinZ = Math.sin(ast.rotZ);
        const cosZ = Math.cos(ast.rotZ);

        // Transform vertices: Rotate around local origin + translate to (x, y, z) with mouse parallax
        const worldX = ast.x - mouseX * 0.7;
        const worldY = ast.y - mouseY * 0.7;
        const worldZ = ast.z;

        const transformed: Vertex3D[] = [];
        const projected: { x: number; y: number; visible: boolean }[] = [];

        for (let vIdx = 0; vIdx < ast.baseVertices.length; vIdx++) {
          const v = ast.baseVertices[vIdx];

          // Rotate around X
          const y1 = v.y * cosX - v.z * sinX;
          const z1 = v.y * sinX + v.z * cosX;

          // Rotate around Y
          const x2 = v.x * cosY + z1 * sinY;
          const z2 = -v.x * sinY + z1 * cosY;

          // Rotate around Z
          const x3 = x2 * cosZ - y1 * sinZ;
          const y3 = x2 * sinZ + y1 * cosZ;

          // Translate to world space
          const vx = x3 + worldX;
          const vy = y3 + worldY;
          const vz = z2 + worldZ;

          transformed.push({ x: vx, y: vy, z: vz });

          if (vz > 50) {
            const scale = FOCAL_LENGTH / vz;
            projected.push({
              x: vx * scale + centerX,
              y: vy * scale + centerY,
              visible: true,
            });
          } else {
            projected.push({ x: 0, y: 0, visible: false });
          }
        }

        // Distance / Atmospheric Fog Factor (0.0=distant, 1.0=close)
        const depthAlpha = Math.max(0.12, Math.min(0.85, 1.0 - (ast.z - 300) / 1900));

        // Render polygon faces with directional light shading
        for (let fIdx = 0; fIdx < ast.faces.length; fIdx++) {
          const face = ast.faces[fIdx];
          const v0 = transformed[face[0]];
          const v1 = transformed[face[1]];
          const v2 = transformed[face[2]];

          const p0 = projected[face[0]];
          const p1 = projected[face[1]];
          const p2 = projected[face[2]];

          if (!p0.visible || !p1.visible || !p2.visible) continue;

          // Calculate surface normal: (v1 - v0) x (v2 - v0)
          const ax = v1.x - v0.x;
          const ay = v1.y - v0.y;
          const az = v1.z - v0.z;

          const bx = v2.x - v0.x;
          const by = v2.y - v0.y;
          const bz = v2.z - v0.z;

          const nx = ay * bz - az * by;
          const ny = az * bx - ax * bz;
          const nz = ax * by - ay * bx;

          const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (nLen === 0) continue;

          const normX = nx / nLen;
          const normY = ny / nLen;
          const normZ = nz / nLen;

          // Backface culling: Check if face is pointing towards camera
          // Camera vector from face center to camera (0, 0, 0)
          const cx = -(v0.x + v1.x + v2.x) / 3;
          const cy = -(v0.y + v1.y + v2.y) / 3;
          const cz = -(v0.z + v1.z + v2.z) / 3;
          const cLen = Math.sqrt(cx * cx + cy * cy + cz * cz);
          const dotCam = (normX * cx + normY * cy + normZ * cz) / (cLen || 1);

          if (dotCam <= 0) continue; // culled

          // Compute diffuse lighting intensity
          const dotLight = Math.max(0, normX * lx + normY * ly + normZ * lz);
          const lightIntensity = Math.min(1.0, 0.20 + dotLight * 0.80);

          const isVein = ast.veinFaces[fIdx];

          // Color Palette Application
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.closePath();

          if (isDarkMode) {
            // Dark Mode: Charcoal/Obsidian rock + glowing emerald mineral veins
            if (isVein) {
              const veinShade = Math.floor(120 + lightIntensity * 135);
              ctx.fillStyle = `rgba(16, ${veinShade}, 129, ${depthAlpha * 0.90})`;
              ctx.strokeStyle = `rgba(52, 211, 153, ${depthAlpha * 0.75})`;
              ctx.lineWidth = 1.0;
            } else {
              const grayShade = Math.floor(25 + lightIntensity * 45);
              ctx.fillStyle = `rgba(${grayShade}, ${grayShade + 4}, ${grayShade + 8}, ${depthAlpha * 0.85})`;
              ctx.strokeStyle = `rgba(71, 85, 105, ${depthAlpha * 0.35})`;
              ctx.lineWidth = 0.6;
            }
          } else {
            // Light Mode: Warm slate/graphite rock + subtle gold/amber mineral ridges
            if (isVein) {
              const goldR = Math.floor(180 + lightIntensity * 60);
              const goldG = Math.floor(140 + lightIntensity * 50);
              ctx.fillStyle = `rgba(${goldR}, ${goldG}, 40, ${depthAlpha * 0.85})`;
              ctx.strokeStyle = `rgba(217, 119, 6, ${depthAlpha * 0.60})`;
              ctx.lineWidth = 1.0;
            } else {
              const slateVal = Math.floor(140 + lightIntensity * 85);
              ctx.fillStyle = `rgba(${slateVal}, ${slateVal + 2}, ${slateVal + 6}, ${depthAlpha * 0.80})`;
              ctx.strokeStyle = `rgba(148, 163, 184, ${depthAlpha * 0.40})`;
              ctx.lineWidth = 0.6;
            }
          }

          ctx.fill();
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      style={{
        opacity: isDarkMode ? 0.85 : 0.65,
      }}
    />
  );
};
