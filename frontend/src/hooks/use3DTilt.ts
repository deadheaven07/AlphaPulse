import React, { useRef, useCallback, useState } from "react";

interface TiltOptions {
  maxRotation?: number; // Maximum tilt angle in degrees (e.g. 10)
  scale?: number; // Scale on hover (e.g. 1.02)
  perspective?: number; // Perspective distance in px (e.g. 1000)
  speed?: number; // Transition speed in ms
  glare?: boolean; // Whether to calculate specular sheen coordinates
}

export function use3DTilt<T extends HTMLElement = HTMLDivElement>(options: TiltOptions = {}) {
  const {
    maxRotation = 8,
    scale = 1.015,
    perspective = 1000,
    speed = 400,
    glare = true,
  } = options;

  const elementRef = useRef<T | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = elementRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Cursor offset from center of element (-1 to +1)
      const mouseX = (e.clientX - rect.left - width / 2) / (width / 2);
      const mouseY = (e.clientY - rect.top - height / 2) / (height / 2);

      // Rotation angles
      const rotateX = -mouseY * maxRotation;
      const rotateY = mouseX * maxRotation;

      el.style.transform = `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
      el.style.transition = "transform 100ms cubic-bezier(0.16, 1, 0.3, 1)";

      if (glare) {
        const xPercent = ((e.clientX - rect.left) / width) * 100;
        const yPercent = ((e.clientY - rect.top) / height) * 100;
        el.style.setProperty("--mouse-x", `${xPercent.toFixed(1)}%`);
        el.style.setProperty("--mouse-y", `${yPercent.toFixed(1)}%`);
      }
    },
    [maxRotation, scale, perspective, glare]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    const el = elementRef.current;
    if (el) {
      el.style.willChange = "transform";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    const el = elementRef.current;
    if (!el) return;

    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    el.style.transition = `transform ${speed}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  }, [perspective, speed]);

  return {
    ref: elementRef,
    isHovered,
    tiltProps: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
}
