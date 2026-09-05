import { useState, useEffect, useRef } from "react";

export interface Scroll3DState {
  scrollY: number;
  scrollProgress: number; // 0.0 to 1.0
  scrollVelocity: number;
  isScrolling: boolean;
}

export function useScroll3D(): Scroll3DState {
  const [scrollState, setScrollState] = useState<Scroll3DState>({
    scrollY: 0,
    scrollProgress: 0,
    scrollVelocity: 0,
    isScrolling: false,
  });

  const lastScrollY = useRef<number>(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY || document.documentElement.scrollTop;
        const maxScroll = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight
        );
        const progress = Math.min(1, Math.max(0, currentScrollY / maxScroll));
        const velocity = currentScrollY - lastScrollY.current;
        lastScrollY.current = currentScrollY;

        setScrollState({
          scrollY: currentScrollY,
          scrollProgress: progress,
          scrollVelocity: velocity,
          isScrolling: true,
        });

        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          setScrollState((prev) => ({ ...prev, isScrolling: false, scrollVelocity: 0 }));
        }, 150);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrameId);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return scrollState;
}
