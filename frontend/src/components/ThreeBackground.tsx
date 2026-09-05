import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface ThreeBackgroundProps {
  isDarkMode: boolean;
  scrollProgress?: number; // 0.0 to 1.0 from window scroll
  shockwaveTrigger?: { id: number; type: "buy" | "profit" | "warn" | "pulse"; timestamp: number } | null;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  isDarkMode,
  scrollProgress = 0,
  shockwaveTrigger = null,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    gridMesh: THREE.Mesh;
    gridGeom: THREE.PlaneGeometry;
    particleSystem: THREE.Points;
    particleGeom: THREE.BufferGeometry;
    ringGroup: THREE.Group;
    rings: THREE.Mesh[];
    shockwaves: { mesh: THREE.Mesh; birth: number; maxRadius: number; speed: number; color: string }[];
    targetCameraX: number;
    targetCameraY: number;
    targetCameraZ: number;
    currentCameraX: number;
    currentCameraY: number;
    currentCameraZ: number;
  } | null>(null);

  const scrollRef = useRef<number>(scrollProgress);
  scrollRef.current = scrollProgress;

  // Track Shockwaves Triggered from UI Actions
  useEffect(() => {
    if (!shockwaveTrigger || !sceneRef.current) return;
    const { scene, shockwaves } = sceneRef.current;

    const colorMap = {
      buy: isDarkMode ? 0x06b6d4 : 0x0284c7, // Cyan / Sky Blue
      profit: isDarkMode ? 0x10b981 : 0x059669, // Emerald Green
      warn: isDarkMode ? 0xf59e0b : 0xd97706, // Amber Gold
      pulse: isDarkMode ? 0x8b5cf6 : 0x7c3aed, // Violet
    };

    const shockColor = colorMap[shockwaveTrigger.type] || (isDarkMode ? 0x06b6d4 : 0x0284c7);
    const ringGeom = new THREE.RingGeometry(10, 22, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: shockColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const shockMesh = new THREE.Mesh(ringGeom, ringMat);
    shockMesh.rotation.x = -Math.PI / 2.3;
    shockMesh.position.set(
      (Math.random() - 0.5) * 400,
      -260 + (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 300
    );

    scene.add(shockMesh);
    shockwaves.push({
      mesh: shockMesh,
      birth: performance.now(),
      maxRadius: 480,
      speed: 180,
      color: shockwaveTrigger.type,
    });
  }, [shockwaveTrigger, isDarkMode]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. WebGL Renderer
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Scene & Fog
    const scene = new THREE.Scene();
    const fogColor = isDarkMode ? 0x0f1117 : 0xf1f3f7;
    scene.fog = new THREE.FogExp2(fogColor, 0.00065);

    // 3. Perspective Camera
    const camera = new THREE.PerspectiveCamera(52, width / height, 1, 4000);
    camera.position.set(0, 100, 680);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(isDarkMode ? 0x1e293b : 0xe2e8f0, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(isDarkMode ? 0x06b6d4 : 0x3b82f6, 3, 1600);
    pointLight1.position.set(400, 300, 200);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(isDarkMode ? 0x8b5cf6 : 0xd97706, 2.5, 1600);
    pointLight2.position.set(-400, -200, 300);
    scene.add(pointLight2);

    // 5. Deformable 3D Quantum Liquidity Grid (Wave Plane)
    const gridCols = 54;
    const gridRows = 54;
    const gridGeom = new THREE.PlaneGeometry(2400, 2400, gridCols - 1, gridRows - 1);
    const gridMat = new THREE.MeshBasicMaterial({
      color: isDarkMode ? 0x1e3a8a : 0x93c5fd,
      wireframe: true,
      transparent: true,
      opacity: isDarkMode ? 0.28 : 0.22,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });
    const gridMesh = new THREE.Mesh(gridGeom, gridMat);
    gridMesh.rotation.x = -Math.PI / 2.25;
    gridMesh.position.set(0, -320, -200);
    scene.add(gridMesh);

    // Store base vertex positions for mathematical wave oscillation
    const baseGridPositions = gridGeom.attributes.position.clone();

    // 6. 3,200+ Instanced Cyber Particles & Star Constellation
    const PARTICLE_COUNT = 3200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);
    const particleSizes = new Float32Array(PARTICLE_COUNT);

    const cyanColor = new THREE.Color(isDarkMode ? 0x06b6d4 : 0x2563eb);
    const emeraldColor = new THREE.Color(isDarkMode ? 0x10b981 : 0x059669);
    const violetColor = new THREE.Color(isDarkMode ? 0x8b5cf6 : 0xd97706);
    const whiteColor = new THREE.Color(isDarkMode ? 0xffffff : 0x475569);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Cylinder / Space distribution
      const radius = 200 + Math.random() * 1100;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1400;

      particlePositions[i3] = Math.cos(theta) * radius;
      particlePositions[i3 + 1] = y;
      particlePositions[i3 + 2] = Math.sin(theta) * radius - 100;

      // Color distribution
      const rand = Math.random();
      let chosenColor = cyanColor;
      if (rand < 0.35) chosenColor = cyanColor;
      else if (rand < 0.65) chosenColor = emeraldColor;
      else if (rand < 0.85) chosenColor = violetColor;
      else chosenColor = whiteColor;

      particleColors[i3] = chosenColor.r;
      particleColors[i3 + 1] = chosenColor.g;
      particleColors[i3 + 2] = chosenColor.b;

      particleSizes[i] = 1.5 + Math.random() * 3.5;
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
    particleGeom.setAttribute("size", new THREE.BufferAttribute(particleSizes, 1));

    // Custom Particle Canvas Texture for soft circular glow
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.3, "rgba(255,255,255,0.7)");
      grad.addColorStop(0.7, "rgba(255,255,255,0.15)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 3.2,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: isDarkMode ? 0.85 : 0.65,
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 7. Volumetric Gyroscopic Market Rings (Astrolabe / Quantum Reactor)
    const ringGroup = new THREE.Group();
    ringGroup.position.set(0, -40, -180);
    scene.add(ringGroup);

    const ringRadii = [280, 370, 460];
    const ringMats = [
      new THREE.MeshBasicMaterial({
        color: isDarkMode ? 0x06b6d4 : 0x3b82f6,
        transparent: true,
        opacity: isDarkMode ? 0.35 : 0.22,
        wireframe: true,
      }),
      new THREE.MeshBasicMaterial({
        color: isDarkMode ? 0x10b981 : 0x059669,
        transparent: true,
        opacity: isDarkMode ? 0.28 : 0.18,
        wireframe: true,
      }),
      new THREE.MeshBasicMaterial({
        color: isDarkMode ? 0x8b5cf6 : 0xd97706,
        transparent: true,
        opacity: isDarkMode ? 0.22 : 0.14,
        wireframe: true,
      }),
    ];

    const rings: THREE.Mesh[] = [];
    ringRadii.forEach((rad, idx) => {
      const ringGeom = new THREE.TorusGeometry(rad, 1.8, 12, 90);
      const ringMesh = new THREE.Mesh(ringGeom, ringMats[idx]);
      ringMesh.rotation.x = (Math.PI / 4) * (idx + 1);
      ringMesh.rotation.y = (Math.PI / 6) * (idx + 1);
      ringGroup.add(ringMesh);
      rings.push(ringMesh);
    });

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      gridMesh,
      gridGeom,
      particleSystem,
      particleGeom,
      ringGroup,
      rings,
      shockwaves: [],
      targetCameraX: 0,
      targetCameraY: 100,
      targetCameraZ: 680,
      currentCameraX: 0,
      currentCameraY: 100,
      currentCameraZ: 680,
    };

    // 8. Mouse Tracking with Parallax Dampening
    const handleMouseMove = (e: MouseEvent) => {
      if (!sceneRef.current) return;
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;

      sceneRef.current.targetCameraX = normX * 90;
      sceneRef.current.targetCameraY = 100 - normY * 70;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 9. Resize Handler
    const handleResize = () => {
      if (!sceneRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 10. Animation & Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Respect tab visibility
      if (document.hidden) return;

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      const state = sceneRef.current;
      if (!state) return;

      // A. Camera Trajectory: Mouse Parallax + Scroll-Driven Spline
      const currentScroll = scrollRef.current; // 0.0 to 1.0
      // Camera zooms in slightly and descends as user scrolls down the workstation
      state.targetCameraZ = 680 - currentScroll * 240;
      const scrollYOffset = currentScroll * 180;

      state.currentCameraX += (state.targetCameraX - state.currentCameraX) * 0.05;
      state.currentCameraY += (state.targetCameraY - scrollYOffset - state.currentCameraY) * 0.05;
      state.currentCameraZ += (state.targetCameraZ - state.currentCameraZ) * 0.05;

      camera.position.set(state.currentCameraX, state.currentCameraY, state.currentCameraZ);
      camera.lookAt(0, -60 - scrollYOffset * 0.4, -120);

      // B. Wave Grid Deformation Mathematics
      const posAttr = gridGeom.attributes.position;
      const basePos = baseGridPositions.array as Float32Array;
      const posArr = posAttr.array as Float32Array;

      for (let i = 0; i < posAttr.count; i++) {
        const i3 = i * 3;
        const x = basePos[i3];
        const y = basePos[i3 + 1];

        // Harmonic dual-wave equations simulating quantum market liquidity flow
        const z =
          Math.sin(x * 0.005 + elapsedTime * 1.6) * 22 +
          Math.cos(y * 0.006 + elapsedTime * 1.3) * 18 +
          Math.sin((x + y) * 0.003 + elapsedTime * 2.0) * 12;

        posArr[i3 + 2] = z;
      }
      posAttr.needsUpdate = true;

      // C. Rotate Particles & Gyro Rings
      particleSystem.rotation.y = elapsedTime * 0.025;
      particleSystem.rotation.x = Math.sin(elapsedTime * 0.015) * 0.05;

      rings.forEach((ring, idx) => {
        ring.rotation.x += delta * (0.18 + idx * 0.08);
        ring.rotation.y += delta * (0.12 + idx * 0.06);
        ring.rotation.z += delta * (0.15 + idx * 0.05);
      });

      // D. Shockwaves Animation & Decay
      const now = performance.now();
      for (let i = state.shockwaves.length - 1; i >= 0; i--) {
        const sw = state.shockwaves[i];
        const age = (now - sw.birth) / 1000;
        const currentScale = 1 + age * 12;
        sw.mesh.scale.set(currentScale, currentScale, 1);

        const mat = sw.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.85 - age * 0.75);

        if (mat.opacity <= 0 || currentScale >= 28) {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          mat.dispose();
          state.shockwaves.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (sceneRef.current) {
        sceneRef.current.gridGeom.dispose();
        (sceneRef.current.gridMesh.material as THREE.Material).dispose();
        sceneRef.current.particleGeom.dispose();
        (sceneRef.current.particleSystem.material as THREE.Material).dispose();
        particleTexture.dispose();
        sceneRef.current.rings.forEach((r) => {
          r.geometry.dispose();
          (r.material as THREE.Material).dispose();
        });
        sceneRef.current.shockwaves.forEach((sw) => {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          (sw.mesh.material as THREE.Material).dispose();
        });
        renderer.dispose();
      }

      container.innerHTML = "";
      sceneRef.current = null;
    };
  }, [isDarkMode]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        opacity: isDarkMode ? 0.95 : 0.85,
        transition: "opacity 0.5s ease",
      }}
    />
  );
};
